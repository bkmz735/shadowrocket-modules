/**
 * 🛡️ Ozon AdBlock & Deep Cleaner v3
 * Точечное удаление рекламных баннеров, промо Ozon Банка (оформление карт/кредитов), видео-рекламы и трекеров
 */

const url = $request ? $request.url : "";

// Список префиксов рекламных виджетов
const AD_WIDGET_PREFIXES = [
    "advbanner",
    "adbanner",
    "banner",
    "advvideobannermobile",
    "entrybannerwidget",
    "advrefreshwithdelay",
    "promobanner",
    "adcarousel"
];

function isAdWidget(key) {
    if (!key) return false;
    const lower = key.toLowerCase();
    for (const prefix of AD_WIDGET_PREFIXES) {
        if (lower.startsWith(prefix)) {
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

        // 1. Фильтрация widgetStates
        if (data.widgetStates && typeof data.widgetStates === "object") {
            for (const key of Object.keys(data.widgetStates)) {
                let shouldDelete = isAdWidget(key);

                // Дополнительная проверка содержимого на промо оформления карты / кредитки в банковских экранах
                if (!shouldDelete) {
                    const rawVal = JSON.stringify(data.widgetStates[key]);
                    // Если это промо-карточка оформления Ozon карты или кредитного продукта
                    if (
                        (key.toLowerCase().includes("card") || key.toLowerCase().includes("curtain") || key.toLowerCase().includes("banner")) &&
                        (rawVal.includes("Кредитная карта") || rawVal.includes("order-card") || rawVal.includes("orderCardType") || rawVal.includes("Оформить карту"))
                    ) {
                        shouldDelete = true;
                    }
                }

                if (shouldDelete) {
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
                if (deletedWidgetKeys.has(widgetKey) || isAdWidget(widgetKey)) {
                    return false;
                }
                return true;
            });

            // Очистка дублирующихся разделителей
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