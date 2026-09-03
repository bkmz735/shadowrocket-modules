/**
 * 🛡️ Ozon AdBlock & Deep Cleaner
 * Вырезание рекламы, баннеров Ozon Банка (кредиты/карты), чаевых («поблагодарить продавца»), видео-рекламы и трекеров
 */

const url = $request ? $request.url : "";

// Префиксы заведомо рекламных виджетов Ozon Composer
const AD_WIDGET_PREFIXES = [
    "advbanner",
    "adbanner",
    "banner",
    "advvideobannermobile",
    "entrybannerwidget",
    "advrefreshwithdelay",
    "promobanner",
    "adcarousel",
    "rateitems" // Виджет «Оцените товары / Поблагодарить продавца (чаевые)» на главной
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

function shouldDeleteWidget(key, val) {
    if (isAdWidget(key)) return true;

    const lowerKey = key.toLowerCase();
    const str = typeof val === "string" ? val : JSON.stringify(val);

    // 1. «Поблагодарить продавца» / Чаевые / Оценка товаров
    if (
        str.includes("поблагодарить") ||
        str.includes("Поблагодарить") ||
        str.includes("чаевые") ||
        str.includes("Чаевые") ||
        str.includes("tips") ||
        lowerKey.includes("rateitem") ||
        lowerKey.includes("tipping")
    ) {
        return true;
    }

    // 2. Банковские промо-виджеты в ЛК и Банке («Кредитная карта», «до 1 000 000», карусель карт)
    if (
        lowerKey.includes("finance") ||
        lowerKey.includes("banner") ||
        lowerKey.includes("card") ||
        lowerKey.includes("curtain") ||
        lowerKey.includes("tilescroll") || // горизонтальная карусель
        lowerKey.includes("tilegrid")
    ) {
        if (
            str.includes("Кредитная карта") ||
            str.includes("кредитная карта") ||
            str.includes("1 000 000") ||
            str.includes("1 000 000") ||
            str.includes("1000000") ||
            str.includes("До 500") ||
            str.includes("order-card") ||
            str.includes("orderCardType") ||
            str.includes("Оформить карту") ||
            str.includes("Карта Ozon") ||
            str.includes("Карта Озон")
        ) {
            // Если это именно промо/оформление карты, а не баланс пользователя
            if (str.includes("order") || str.includes("оформить") || str.includes("Оформить") || str.includes("credit") || str.includes("Кредит")) {
                return true;
            }
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
                if (deletedWidgetKeys.has(widgetKey) || isAdWidget(widgetKey)) {
                    return false;
                }
                return true;
            });

            // Очистка идущих подряд лишних разделителей после удаления баннеров
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