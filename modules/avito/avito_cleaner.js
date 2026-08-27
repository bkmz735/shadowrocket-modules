/**
 * Скрипт очистки выдачи Avito API (app.avito.ru)
 * 1. Вырезает баннеры, рекламу и промо-виджеты.
 * 2. Фильтрует любые объявления по стоп-словам из argument (ищет совпадения по всему объекту объявления).
 * 3. Логирует статистику и статус стоп-слов.
 */

let blockedKeywords = [];

if (typeof $argument !== 'undefined' && $argument !== null) {
    let rawArg = String($argument).trim();
    
    if (rawArg.startsWith('{') && rawArg.endsWith('}')) {
        try {
            let parsed = JSON.parse(rawArg);
            if (parsed.keywords) rawArg = String(parsed.keywords);
        } catch (e) {}
    }
    
    if (rawArg.toLowerCase().startsWith('keywords:') || rawArg.toLowerCase().startsWith('keywords=')) {
        rawArg = rawArg.substring(rawArg.indexOf(':') + 1 || rawArg.indexOf('=') + 1);
    }
    
    rawArg = rawArg.replace(/^["'{]+|["'}]+$/g, '').trim();

    if (rawArg !== '' && rawArg !== '{keywords}') {
        blockedKeywords = rawArg.split(/[,;|]/).map(s => s.trim().toLowerCase()).filter(Boolean);
    }
}

let body = $response.body;

if (!body) {
    $done({});
}

try {
    let obj = JSON.parse(body);

    let stats = {
        total: 0,
        adsRemoved: 0,
        keywordsRemoved: 0,
        removedTitles: []
    };

    const isAd = (item) => {
        if (!item || typeof item !== 'object') return false;

        const type = (item.type || item.itemType || item.layout || item.kind || item.component || '').toLowerCase();
        const adTypes = [
            'banner',
            'commercial',
            'commercial_banner',
            'ad',
            'direct',
            'yandex_direct',
            'promo',
            'vas',
            'stories',
            'advertising',
            'brand',
            'avitosales',
            'sales'
        ];
        
        if (adTypes.includes(type)) return true;

        if (item.isAd === true || item.isBanner === true || item.isCommercial === true || item.isPromo === true) return true;
        if (item.advertising || item.adDetails || item.banner || item.commercial) return true;

        if (item.value && typeof item.value === 'object') {
            const valType = (item.value.type || item.value.layout || '').toLowerCase();
            if (adTypes.includes(valType)) return true;
            if (item.value.isAd === true || item.value.isBanner === true || item.value.isCommercial === true) return true;
            if (item.value.advertising || item.value.adDetails || item.value.banner) return true;
        }

        return false;
    };

    // 100% глубокий поиск стоп-слов во всем объекте карточки (заголовок, описание, параметры, подзаголовок)
    const containsBlockedKeyword = (item) => {
        if (!blockedKeywords || blockedKeywords.length === 0) return false;

        const itemStr = JSON.stringify(item).toLowerCase();

        for (let keyword of blockedKeywords) {
            if (keyword && itemStr.includes(keyword)) {
                let title = item.title || (item.value && item.value.title) || (item.value && item.value.header) || keyword;
                stats.removedTitles.push(`"${title}" [по слову: ${keyword}]`);
                return true;
            }
        }
        return false;
    };

    const shouldKeepItem = (item) => {
        stats.total++;
        if (isAd(item)) {
            stats.adsRemoved++;
            return false;
        }
        if (containsBlockedKeyword(item)) {
            stats.keywordsRemoved++;
            return false;
        }
        return true;
    };

    const filterArray = (arr) => {
        if (!Array.isArray(arr)) return arr;
        return arr.filter(shouldKeepItem);
    };

    const cleanObject = (root) => {
        if (!root || typeof root !== 'object') return;

        if (Array.isArray(root)) {
            return filterArray(root).map(cleanObject);
        }

        for (let key in root) {
            if (Array.isArray(root[key])) {
                root[key] = filterArray(root[key]);
            } else if (typeof root[key] === 'object') {
                cleanObject(root[key]);
            }
        }
    };

    if (obj.result) {
        if (Array.isArray(obj.result.items)) obj.result.items = filterArray(obj.result.items);
        if (Array.isArray(obj.result.sections)) obj.result.sections = filterArray(obj.result.sections);
        if (Array.isArray(obj.result.widgets)) obj.result.widgets = filterArray(obj.result.widgets);
        cleanObject(obj.result);
    } else if (Array.isArray(obj.items)) {
        obj.items = filterArray(obj.items);
        cleanObject(obj);
    } else {
        cleanObject(obj);
    }

    console.log(`\n🛡️ [Avito Cleaner] Статистика:`);
    console.log(`   Стоп-слова: ` + (blockedKeywords.length ? `[${blockedKeywords.join(', ')}]` : `НЕ ЗАДАНЫ (список пуст)`));
    console.log(`   Всего элементов: ${stats.total} | Удалено рекламы: ${stats.adsRemoved} | Удалено по стоп-словам: ${stats.keywordsRemoved}`);
    if (stats.removedTitles.length > 0) {
        console.log(`   Вырезано: ${stats.removedTitles.slice(0, 5).join('; ')}`);
    }
    console.log(``);

    $done({ body: JSON.stringify(obj) });
} catch (e) {
    $done({});
}
