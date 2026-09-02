/**
 * Deep Cleaner Script for Avito API v3
 * 1. Убирает продвигаемые объявления, VIP, баннеры (ВСЕГДА)
 * 2. Глубоко ищет ключевые слова (в заголовках, описаниях, сниппетах)
 * 3. Скрывает объявления дороже заданной цены
 * 4. Фильтры kw/mp работают только в указанных категориях
 *
 * Формат аргумента: kw:бпла|дрон;mp:200000;cats:вакансии|услуги
 *   kw   — ключевые слова (разделитель |)
 *   mp   — максимальная цена в рублях (0 = без ограничений)
 *   cats — категории для применения kw/mp (пусто = фильтры отключены, только реклама)
 *          Доступные: вакансии, резюме, работа, услуги, авто, недвижимость, электроника, все
 */

// ─── Константы ───────────────────────────────────────────────────────────────

const AD_TYPES = new Set([
    'banner', 'commercial', 'commercial_banner', 'ad', 'direct',
    'yandex_direct', 'promo', 'vas', 'advertising', 'brand',
    'avitosales', 'sales', 'vip'
]);

const TEXT_KEYS = ['title', 'header', 'description', 'text', 'subtitle', 'snippet', 'shortDescription'];

// Маппинг человекочитаемых названий → массив categoryId
// null означает "все категории"
const CATEGORY_MAP = {
    // Вакансии (отдельно)
    'вакансии': [111], 'вакансия': [111],
    // Резюме (отдельно)
    'резюме': [112],
    // Работа = мета-алиас (вакансии + резюме)
    'работа': [111, 112],
    // Услуги
    'услуги': [114], 'услуга': [114],
    // Транспорт
    'авто': [4], 'транспорт': [4], 'машины': [4], 'машина': [4],
    // Недвижимость
    'недвижимость': [2], 'квартиры': [2], 'квартира': [2],
    // Электроника
    'электроника': [6], 'телефоны': [6],
    // Мета: всё
    'всё': null, 'все': null, 'all': null,
};

// Контексты из URL для резервного определения категории
const CONTEXT_TO_CATEGORY = {
    'jobvacancies': 111,
    'jobresume': 112,
    'service': 114,
};

// ─── Парсинг аргументов ──────────────────────────────────────────────────────

let blockedKeywords = [];
let minPrice = 0;
let maxPrice = 0;
let filterCategoryIds = []; // пустой = kw/mp отключены
let filterEverywhere = false; // true если cats:все/all

// Вспомогательная функция для парсинга цены/диапазона:
// "5000-200000", "от 5000 до 200000", "от 5000", "до 200000", "200000"
const parsePriceRange = (str) => {
    let min = 0;
    let max = 0;
    if (!str) return { min, max };

    const clean = String(str).toLowerCase().replace(/[\s_₽руб]/g, '');

    // Проверяем паттерн "от X до Y" или "отXдоY"
    const fromToMatch = clean.match(/(?:от|^)(\d+)(?:до|-)(\d+)/);
    if (fromToMatch) {
        min = parseInt(fromToMatch[1], 10) || 0;
        max = parseInt(fromToMatch[2], 10) || 0;
        return { min, max };
    }

    // Паттерн "от X"
    const fromOnly = clean.match(/^от(\d+)$/);
    if (fromOnly) {
        min = parseInt(fromOnly[1], 10) || 0;
        return { min, max };
    }

    // Паттерн "до Y"
    const toOnly = clean.match(/^до(\d+)$/);
    if (toOnly) {
        max = parseInt(toOnly[1], 10) || 0;
        return { min, max };
    }

    // Паттерн просто число "X" (трактуем как верхнюю границу)
    const singleNum = clean.match(/^(\d+)$/);
    if (singleNum) {
        max = parseInt(singleNum[1], 10) || 0;
        return { min, max };
    }

    return { min, max };
};

if (typeof $argument !== 'undefined' && $argument !== null) {
    let rawArg = String($argument).trim();

    // Поддержка JSON-объекта { keywords: "...", price: "5000-200000", max_price: 200000 }
    if (rawArg.startsWith('{') && rawArg.endsWith('}')) {
        try {
            const parsed = JSON.parse(rawArg);
            if (parsed.keywords) rawArg = String(parsed.keywords);
            if (parsed.price) {
                const pr = parsePriceRange(parsed.price);
                minPrice = pr.min;
                maxPrice = pr.max;
            } else if (parsed.max_price) {
                maxPrice = parseInt(parsed.max_price, 10) || 0;
            }
        } catch (e) {}
    }

    // Новый формат: kw:слова;mp:5000-200000;cats:вакансии|работа
    const kwMatch = rawArg.match(/(?:^|;)\s*kw:([^;]*)/i);
    const mpMatch = rawArg.match(/(?:^|;)\s*mp:([^;]*)/i);
    const catsMatch = rawArg.match(/(?:^|;)\s*cats:([^;]*)/i);

    if (kwMatch || mpMatch || catsMatch) {
        // Новый формат
        if (kwMatch) rawArg = kwMatch[1].trim();
        else rawArg = '';
        if (mpMatch) {
            const pr = parsePriceRange(mpMatch[1]);
            minPrice = pr.min;
            maxPrice = pr.max;
        }

        // Парсинг категорий
        if (catsMatch) {
            const catNames = catsMatch[1].split(/[,|]/).map(s => s.trim().toLowerCase()).filter(Boolean);
            for (let i = 0; i < catNames.length; i++) {
                const name = catNames[i];
                if (name in CATEGORY_MAP) {
                    const ids = CATEGORY_MAP[name];
                    if (ids === null) {
                        filterEverywhere = true;
                    } else {
                        for (let j = 0; j < ids.length; j++) {
                            if (filterCategoryIds.indexOf(ids[j]) === -1) {
                                filterCategoryIds.push(ids[j]);
                            }
                        }
                    }
                }
            }
        }
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

// ─── Определение категории текущего запроса ──────────────────────────────────

const requestUrl = (typeof $request !== 'undefined' && $request.url) ? $request.url : '';

const detectCategoryFromUrl = (url) => {
    if (!url) return null;
    // Ищем categoryId в URL
    const catMatch = url.match(/[?&]categoryId=(\d+)/);
    if (catMatch) return parseInt(catMatch[1], 10);
    // Ищем context в URL
    const ctxMatch = url.match(/[?&]context=(\w+)/i);
    if (ctxMatch) {
        const ctx = ctxMatch[1].toLowerCase();
        if (ctx in CONTEXT_TO_CATEGORY) return CONTEXT_TO_CATEGORY[ctx];
    }
    return null;
};

const currentCategory = detectCategoryFromUrl(requestUrl);

// Определяем, нужно ли применять kw/mp фильтры
const shouldApplyFilters = filterEverywhere ||
    (filterCategoryIds.length > 0 && currentCategory !== null && filterCategoryIds.indexOf(currentCategory) !== -1);

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
    }

    return false;
};

/**
 * Рекурсивно извлекает строковые значения текстовых полей из узла.
 */
const extractText = (node, acc, visited, depth) => {
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
 */
const extractPrice = (item) => {
    const toNum = (v) => {
        if (typeof v === 'number') return v;
        if (typeof v === 'string') {
            const n = parseInt(v.replace(/[^\d]/g, ''), 10);
            return isNaN(n) ? null : n;
        }
        return null;
    };

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
    extractText(item, acc, new Set(), 0);

    if (acc.length === 0) return false;

    const fullText = acc.join(' ').toLowerCase();

    for (let i = 0; i < blockedKeywords.length; i++) {
        const keyword = blockedKeywords[i];
        if (keyword && fullText.includes(keyword)) {
            const sampleTitle = item.title || (item.value && item.value.title) || acc[0] || 'No Title';
            stats.removedTitles.push('"' + sampleTitle + '" [kw: ' + keyword + ']');
            return true;
        }
    }
    return false;
};

/**
 * Определяет, нужно ли оставить элемент; обновляет статистику.
 * Реклама убирается ВСЕГДА. kw/mp — только если категория совпадает.
 */
const shouldKeepItem = (item, stats) => {
    stats.total++;

    // Рекламу убираем ВСЕГДА, независимо от категории
    if (isAd(item)) { stats.adsRemoved++; return false; }

    // kw и mp фильтры — только если shouldApplyFilters = true
    if (!shouldApplyFilters) return true;

    if (containsBlockedKeyword(item, stats)) { stats.keywordsRemoved++; return false; }

    if (minPrice > 0 || maxPrice > 0) {
        const price = extractPrice(item);
        if (price !== null) {
            if (minPrice > 0 && price < minPrice) {
                stats.priceRemoved++;
                const title = item.title || (item.value && item.value.title) || 'No Title';
                stats.removedTitles.push('"' + title + '" [price: ' + price + ' < ' + minPrice + ']');
                return false;
            }
            if (maxPrice > 0 && price > maxPrice) {
                stats.priceRemoved++;
                const title = item.title || (item.value && item.value.title) || 'No Title';
                stats.removedTitles.push('"' + title + '" [price: ' + price + ' > ' + maxPrice + ']');
                return false;
            }
        }
    }

    return true;
};

/**
 * Рекурсивный проход по дереву с фильтрацией всех массивов.
 */
const cleanObject = (root, stats, depth) => {
    if (!root || typeof root !== 'object' || depth > 20) return;

    if (Array.isArray(root)) {
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
            root[key] = root[key].filter(function(item) { return shouldKeepItem(item, stats); });
            root[key].forEach(function(el) { cleanObject(el, stats, depth + 1); });
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

    cleanObject(obj.result !== undefined ? obj.result : obj, stats, 0);

    // Логирование
    console.log('\n========================================');
    console.log('[Avito Deep Cleaner v3]');
    console.log('Category: ' + (currentCategory !== null ? currentCategory : 'N/A') +
        ' | Filters: ' + (shouldApplyFilters ? 'ON' : 'OFF (no cats)'));
    if (blockedKeywords.length > 0) {
        console.log('Keywords: [' + blockedKeywords.join(', ') + ']');
    }
    if (minPrice > 0 || maxPrice > 0) {
        let priceStr = 'Price limit: ';
        if (minPrice > 0 && maxPrice > 0) priceStr += minPrice + ' - ' + maxPrice + ' rub';
        else if (minPrice > 0) priceStr += 'from ' + minPrice + ' rub';
        else if (maxPrice > 0) priceStr += 'up to ' + maxPrice + ' rub';
        console.log(priceStr);
    }
    if (filterCategoryIds.length > 0) {
        console.log('Filter cats: [' + filterCategoryIds.join(', ') + ']' + (filterEverywhere ? ' (ALL)' : ''));
    }
    console.log('Scanned: ' + stats.total + ' | Ads: -' + stats.adsRemoved +
        ' | Keywords: -' + stats.keywordsRemoved + ' | Price: -' + stats.priceRemoved);
    if (stats.removedTitles.length > 0) {
        console.log('Filtered: ' + stats.removedTitles.slice(0, 5).join('; '));
    }
    console.log('========================================\n');

    $done({ body: JSON.stringify(obj) });
} catch (e) {
    console.log('[Avito Cleaner] Error: ' + e);
    $done({});
}
