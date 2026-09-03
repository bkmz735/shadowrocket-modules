/**
 * 🛡️ Ozon AdBlock & Deep Cleaner
 * Вырезание баннеров, чаевых продавцу, промо Ozon Банка (карты/кредиты), видео-рекламы и трекеров
 */

const url = $request ? $request.url : "";

// Префиксы виджетов, подлежащих удалению
const AD_WIDGET_PREFIXES = [
    "advbanner",
    "adbanner",
    "banner",
    "advvideobannermobile",
    "entrybannerwidget",
    "advrefreshwithdelay",
    "promobanner",
    "adcarousel",
    "rateitems",         // Оцените товары / Поблагодарить продавца (чаевые)
    "uwidgetobject",     // Промо-баннеры в ЛК и категориях (object.grid1, banner)
    "navigationblocks"   // Промо-блоки в профиле (если содержат рекламу)
];

function isAdWidgetPrefix(key) {
    if (!key) return false;
    const lower = key.toLowerCase();
    for (const prefix of AD_WIDGET_PREFIXES) {
        if (lower.startsWith(prefix)) {
            return true;
        }
    }
    return false;
}

function shouldDeleteWidget(key, val) {
    const lowerKey = key.toLowerCase();

    // 1. Прямой матчинг по префиксу
    if (isAdWidgetPrefix(key)) {
        // Исключение: navigationBlocks удаляем только если внутри промо/реклама
        if (lowerKey.startsWith("navigationblocks")) {
            const s = JSON.stringify(val);
            if (s.includes("кредит") || s.includes("карта") || s.includes("джекпот") || s.includes("банк")) {
                return true;
            }
            return false;
        }
        return true;
    }

    const str = typeof val === "string" ? val : JSON.stringify(val);

    // 2. «Поблагодарить продавца» / Чаевые / Оценка товаров
    if (
        lowerKey.includes("rateitem") ||
        lowerKey.includes("tipping") ||
        str.includes("поблагодарить") ||
        str.includes("Поблагодарить") ||
        str.includes("чаевые") ||
        str.includes("Чаевые") ||
        str.includes("tips")
    ) {
        return true;
    }

    // 3. Банковские промо-баннеры («До 500 000 ₽», «Кредитная карта», «до 1 000 000», «Оформить карту»)
    if (
        lowerKey.includes("finance") ||
        lowerKey.includes("banner") ||
        lowerKey.includes("card") ||
        lowerKey.includes("curtain") ||
        lowerKey.includes("tilescroll") ||
        lowerKey.includes("celllist")
    ) {
        if (
            str.includes("До 500 000") ||
            str.includes("До 500 000") ||
            str.includes("Кредитная карта") ||
            str.includes("кредитная карта") ||
            str.includes("1 000 000") ||
            str.includes("1 000 000") ||
            str.includes("1000000") ||
            str.includes("order-card") ||
            str.includes("orderCardType") ||
            str.includes("Оформить карту") ||
            str.includes("чтобы продлить лето")
        ) {
            return true;
        }
    }

    return false;
}

function cleanOzonPayload(rawBody) {
    if (!rawBody) return rawBody;

    try {
        const data = JSON.parse(rawBody);
        let modified = false;

        const deletedWidgetKeys = new Set();

        // 1. Очистка widgetStates
        if (data.widgetStates && typeof data.widgetStates === "object") {
            for (const key of Object.keys(data.widgetStates)) {
                if (shouldDeleteWidget(key, data.widgetStates[key])) {
                    delete data.widgetStates[key];
                    deletedWidgetKeys.add(key);
                    modified = true;
                }
            }
        }

        // 2. Очистка дерева layout
        if (Array.isArray(data.layout)) {
            const initialLen = data.layout.length;
            
            data.layout = data.layout.filter(item => {
                const widgetKey = item.widgetKey || item.name || item.component || "";
                const lowerKey = widgetKey.toLowerCase();

                // Проверка по имени компонента в layout
                if (
                    lowerKey.includes("fintabbannerpriority") || // Баннер в банке
                    lowerKey.includes("advbanner") ||
                    lowerKey.includes("advvideobannermobile") ||
                    lowerKey.includes("entrybannerwidget") ||
                    lowerKey.includes("rateitems") ||
                    deletedWidgetKeys.has(widgetKey) ||
                    isAdWidgetPrefix(widgetKey)
                ) {
                    return false;
                }
                return true;
            });

            // Очистка идущих подряд лишних разделителей
            const cleanedLayout = [];
            for (let i = 0; i < data.layout.length; i++) {
                const cur = data.layout[i];
                const curKey = (cur.widgetKey || cur.name || cur.component || "").toLowerCase();
                const isSep = curKey.includes("separator");

                if (isSep && cleanedLayout.length > 0) {
                    const prevKey = (cleanedLayout[cleanedLayout.length - 1].widgetKey || 
                                     cleanedLayout[cleanedLayout.length - 1].name || 
                                     cleanedLayout[cleanedLayout.length - 1].component || "").toLowerCase();
                    if (prevKey.includes("separator")) {
                        continue;
                    }
                }
                cleanedLayout.push(cur);
            }
            data.layout = cleanedLayout;

            if (data.layout.length !== initialLen) {
                modified = true;
            }
        }

        // 3. Зачистка встроенной аналитики
        if (data.trackingPayloads) {
            delete data.trackingPayloads;
            modified = true;
        }

        return modified ? JSON.stringify(data) : rawBody;

    } catch (e) {
        return rawBody;
    }
}

if (typeof $response !== "undefined" && $response.body) {
    const cleaned = cleanOzonPayload($response.body);
    $done({ body: cleaned });
} else {
    $done({});
}