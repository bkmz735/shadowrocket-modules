/**
 * 🛡️ Ozon AdBlock & Deep Cleaner
 * Вырезание рекламы, баннеров, чаевых и промо-акций
 */

const url = $request ? $request.url : "";

// Префиксы заведомо рекламных виджетов Ozon
const AD_WIDGET_PREFIXES = [
    "advbanner",
    "adbanner",
    "banner",
    "advvideobannermobile",
    "entrybannerwidget",
    "advrefreshwithdelay",
    "promobanner",
    "adcarousel",
    "rateitems" // «Поблагодарить продавца»
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

    // 1. АБСОЛЮТНЫЙ ЗАПРЕТ НА УДАЛЕНИЕ И МОДИФИКАЦИЮ ЛЮБЫХ ВИДЖЕТОВ ФИНАНСОВ В ЛК
    if (lowerKey.startsWith("financewidget") || lowerKey.startsWith("financeheaderwidget")) {
        return false;
    }

    // 2. Прямой матчинг по заведомо рекламным префиксам
    if (isAdWidgetPrefix(key)) {
        return true;
    }

    const str = typeof val === "string" ? val : JSON.stringify(val);

    // 3. «Поблагодарить продавца» / Чаевые
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

    // 4. Баннер кредита в Ozon Банке (banklanding)
    if (
        lowerKey.includes("adbanner") ||
        str.includes("До 500 000") ||
        str.includes("чтобы продлить лето")
    ) {
        return true;
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

                // Финансы и шапку финансов в ЛК не трогаем ни в коем случае!
                if (lowerKey.includes("financewidget") || lowerKey.includes("financeheaderwidget")) {
                    return true;
                }

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