/**
 * Deep Cleaner Script for Avito API
 * 1. Убирает продвигаемые объявления, VIP, баннеры
 * 2. Глубоко ищет ключевые слова (в заголовках, описаниях, сниппетах)
 * 3. Скрывает объявления дороже заданной цены
 *
 * Формат аргумента: kw:бпла|дрон;mp:200000
 *   kw — ключевые слова (разделитель | , ;)
 *   mp — максимальная цена в рублях (0 или отсутствие = без ограничений)
 */

// Вынесено в модульную область — создаётся один раз, Set даёт O(1) поиск
const AD_TYPES = new Set([
    'banner', 'commercial', 'commercial_banner', 'ad', 'direct',
    'yandex_direct', 'promo', 'vas', 'advertising', 'brand',
    'avitosales', 'sales', 'vip'
]);

const TEXT_KEYS = ['title', 'header', 'description', 'text', 'subtitle', 'snippet', 'shortDescription'];

// ─── Парсинг аргументов ──────────────────────────────────────────────────────

let blockedKeywords = [];
let maxPrice = 0; // 0 = без ограничений

if (typeof $argument !== 'undefined' && $argument !== null) {
    let rawArg = String($argument).trim();

    // Поддержка JSON-объекта { keywords: "...", max_price: 200000 }
    if (rawArg.startsWith('{') && rawArg.endsWith('}')) {
        try {
            const parsed = JSON.parse(rawArg);
            if (parsed.keywords) rawArg = String(parsed.keywords);
            if (parsed.max_price) maxPrice = parseInt(parsed.max_price, 10) || 0;
        } catch (e) {}
    }

    // Новый формат: kw:слова;mp:200000
    // Части разделены символом ';' вне секций kw/mp
    // Backward-compatible: если нет kw:/mp: — трактуем как старый формат (только ключевые слова)
    const kwMatch = rawArg.match(/(?:^|;)\s*kw:([^;]*)/i);
    const mpMatch = rawArg.match(/(?:^|;)\s*mp:([^;]*)/i);

    if (kwMatch || mpMatch) {
        // Новый формат
        if (kwMatch) rawArg = kwMatch[1].trim();
        else rawArg = '';
        if (mpMatch) maxPrice = parseInt(mpMatch[1].replace(/[\s_]/g, ''), 10) || 0;
    } else {
        // Старый формат: чистим legacy-префиксы
        const lower = rawArg.toLowerCase();
        if (lower.startsWith('keywords:')) rawArg = rawArg.substring('keywords:'.length);
        else if (lower.startsWith('keywords=')) rawArg = rawArg.substring('keywords='.length);
    }

    rawArg = rawArg.replace(/^[\"'{]+|[\"'}]+$/g, '').trim();

    if (rawArg !== '' && rawArg !== '{keywords}' && rawArg !== '{{{keywords}}}') {
        blockedKeywords = rawArg.split(/[,|]/).map(s => s.trim().toLowerCase()).filter(Boolean);
    }
}

// ─── Тело ответа ─────────────────────────────────────────────────────────────

const body = $response.body;
if (!body) $done({});

// ─── Вспомогательные функции ─────────────────────────────────────────────────

/**
 * Проверяет, является ли item рекламным блоком.
 */
const isAd = (item) => {
    if (!item || typeof item !== 'object') return false;

    const type = (item.type || item.itemType || item.layout || item.kind || item.component || '').toLowerCase();
    if (AD_TYPES.has(type)) return true;

    if (item.isAd || item.isBanner || item.isCommercial || item.isPromo || item.advertising || item.adDetails) return true;

    if (item.value && typeof item.value === 'object') {
        const valType = (item.value.type || item.value.layout || '').toLowerCase();
        if (AD_TYPES.has(valType)) return true;
        if (item.value.isAd || item.value.isBanner || item.value.isCommercial || item.value.advertising) return true;
        // Пропускаем "VIP" бейджи на объявлениях или удаляем само объявление?
        // Иногда item.value.badge.type == 'vip'
    }

    return false;
};

/**
 * Рекурсивно извлекает строковые значения текстовых полей из узла.
 * Принимает внешний массив acc — не пересоздаёт замыкание при каждом вызове.
 * Защита от циклических ссылок через visited Set.
 */
const extractText = (node, acc, visited, depth = 0) => {
    if (!node || typeof node !== 'object' || depth > 10) return;
    if (visited.has(node)) return;
    visited.add(node);

    if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) extractText(node[i], acc, visited, depth + 1);
        return;
    }

    for (let i = 0; i < TEXT_KEYS.length; i++) {
        const k = TEXT_KEYS[i];
        if (typeof node[k] === 'string') acc.push(node[k]);
    }

    for (const k in node) {
        if (node[k] && typeof node[k] === 'object') extractText(node[k], acc, visited, depth + 1);
    }
};

/**
 * Извлекает числовую цену из item.
 * Авито API хранит цену в разных полях в зависимости от версии:
 *   item.price                        → число или строка "200 000"
 *   item.priceDetailed.value          → число
 *   item.value.price                  → число или строка
 *   item.value.priceDetailed.value    → число
 * Возвращает число или null если цена не найдена.
 */
const extractPrice = (item) => {
    // Вспомогательная: достать число из значения поля
    const toNum = (v) => {
        if (typeof v === 'number') return v;
        if (typeof v === 'string') {
            const n = parseInt(v.replace(/[^\d]/g, ''), 10);
            return isNaN(n) ? null : n;
        }
        return null;
    };

    // Прямые числовые поля
    const candidates = [
        item.price,
        item.priceRur,
        item.priceValue,
        item.priceDetailed && item.priceDetailed.value,
        item.value && item.value.price,
        item.value && item.value.priceRur,
        item.value && item.value.priceDetailed && item.value.priceDetailed.value,
        item.value && item.value.priceValue,
    ];

    for (let i = 0; i < candidates.length; i++) {
        const n = toNum(candidates[i]);
        if (n !== null) return n;
    }
    return null;
};

/**
 * Проверяет, содержит ли item заблокированное ключевое слово.
 */
const containsBlockedKeyword = (item, stats) => {
    if (blockedKeywords.length === 0) return false;

    const acc = [];
    extractText(item, acc, new Set());

    if (acc.length === 0) return false;

    const fullText = acc.join(' ').toLowerCase();

    for (let i = 0; i < blockedKeywords.length; i++) {
        const keyword = blockedKeywords[i];
        if (keyword && fullText.includes(keyword)) {
            const sampleTitle = item.title || (item.value && item.value.title) || acc[0] || 'No Title';
            stats.removedTitles.push(`"${sampleTitle}" [Match: ${keyword}]`);
            return true;
        }
    }
    return false;
};

/**
 * Определяет, нужно ли оставить элемент; обновляет статистику.
 */
const shouldKeepItem = (item, stats) => {
    stats.total++;
    if (isAd(item)) { stats.adsRemoved++; return false; }
    if (containsBlockedKeyword(item, stats)) { stats.keywordsRemoved++; return false; }
    if (maxPrice > 0) {
        const price = extractPrice(item);
        if (price !== null && price > maxPrice) {
            stats.priceRemoved++;
            const title = item.title || (item.value && item.value.title) || 'No Title';
            stats.removedTitles.push(`"${title}" [Price: ${price} > ${maxPrice}]`);
            return false;
        }
    }
    return true;
};

/**
 * Рекурсивный проход по дереву с фильтрацией всех массивов.
 * Для массива-корня мутирует его на месте через splice (сохраняет ссылку).
 */
const cleanObject = (root, stats, depth = 0) => {
    if (!root || typeof root !== 'object' || depth > 20) return;

    if (Array.isArray(root)) {
        // Итерируем с конца, чтобы splice не ломал индексы
        for (let i = root.length - 1; i >= 0; i--) {
            if (!shouldKeepItem(root[i], stats)) {
                root.splice(i, 1);
            } else {
                cleanObject(root[i], stats, depth + 1);
            }
        }
        return;
    }

    for (const key in root) {
        if (Array.isArray(root[key])) {
            root[key] = root[key].filter(item => shouldKeepItem(item, stats));
            root[key].forEach(el => cleanObject(el, stats, depth + 1));
        } else if (root[key] && typeof root[key] === 'object') {
            cleanObject(root[key], stats, depth + 1);
        }
    }
};

// ─── Основная логика ──────────────────────────────────────────────────────────

try {
    const obj = JSON.parse(body);

    const stats = {
        total: 0,
        adsRemoved: 0,
        keywordsRemoved: 0,
        priceRemoved: 0,
        removedTitles: []
    };

    // Запускаем очистку
    cleanObject(obj.result !== undefined ? obj.result : obj, stats);

    console.log(`\n========================================`);
    console.log(`[Avito Deep Cleaner] 🔎`);
    console.log(`Keywords: ` + (blockedKeywords.length ? `[${blockedKeywords.join(', ')}]` : `NONE`));
    console.log(`Max Price: ` + (maxPrice > 0 ? `${maxPrice.toLocaleString()} ₽` : `NONE`));
    console.log(`Scanned: ${stats.total} | Ads: -${stats.adsRemoved} | Keywords: -${stats.keywordsRemoved} | Price: -${stats.priceRemoved}`);
    if (stats.removedTitles.length > 0) {
        console.log(`Filtered: ${stats.removedTitles.slice(0, 5).join('; ')}`);
    }
    console.log(`========================================\n`);

    $done({ body: JSON.stringify(obj) });
} catch (e) {
    console.log(`[Avito Cleaner] Error: ${e}`);
    $done({});
}
