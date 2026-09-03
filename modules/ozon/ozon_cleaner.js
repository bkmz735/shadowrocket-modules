/**
 * Ozon Cleaner
 * Фильтрация рекламы, рекламных полок, спонсорских виджетов и трекеров в API Ozon
 */

const url = $request.url;

function cleanBody(rawBody) {
    if (!rawBody) return rawBody;
    try {
        let obj = JSON.parse(rawBody);

        // Очистка виджетов Ozon (динамические страницы / мобильный API)
        if (obj.widgetStates && typeof obj.widgetStates === "object") {
            for (const key of Object.keys(obj.widgetStates)) {
                const lowerKey = key.toLowerCase();
                // Фильтрация рекламных баннеров, промо-блоков и рекламных каруселей
                if (
                    lowerKey.includes("banner") ||
                    lowerKey.includes("advert") ||
                    lowerKey.includes("promo") ||
                    lowerKey.includes("commercial")
                ) {
                    delete obj.widgetStates[key];
                }
            }
        }

        // Очистка списков элементов layout/widgets
        if (Array.isArray(obj.widgets)) {
            obj.widgets = obj.widgets.filter(w => {
                const type = (w.type || w.name || "").toLowerCase();
                return !(
                    type.includes("banner") ||
                    type.includes("advert") ||
                    type.includes("promo") ||
                    type.includes("commercial")
                );
            });
        }

        return JSON.stringify(obj);
    } catch (e) {
        return rawBody;
    }
}

if (typeof $response !== "undefined" && $response.body) {
    const modifiedBody = cleanBody($response.body);
    $done({ body: modifiedBody });
} else {
    $done({});
}