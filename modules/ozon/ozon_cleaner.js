/**
 * 🛡️ Ozon AdBlock & Deep Cleaner
 * Вырезание рекламы, баннеров, чаевых и промо-кредиток ВНУТРИ financeWidget с сохранением баланса
 */

const url = $request ? $request.url : "";

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

// Хирургическая чистка financeWidget: оставляем счёт Ozon Карты, удаляем кредитку/рассрочку
function cleanFinanceWidget(widget) {
    if (!widget || typeof widget !== "object") return widget;

    try {
        // 1. Если это карточки в ряд/колонку (leftCard, rightCard, items)
        if (widget.rightCard) {
            const rStr = JSON.stringify(widget.rightCard);
            if (rStr.includes("Кредит") || rStr.includes("кредит") || rStr.includes("1 000 000") || rStr.includes("1 000 000") || rStr.includes("1000000") || rStr.includes("Рассрочка") || rStr.includes("рассрочка")) {
                delete widget.rightCard;
            }
        }

        // 2. Если внутри лежит массив карточек/счетов
        if (Array.isArray(widget.items)) {
            widget.items = widget.items.filter(item => {
                const s = JSON.stringify(item);
                return !(s.includes("Кредит") || s.includes("кредит") || s.includes("1 000 000") || s.includes("1 000 000") || s.includes("Рассрочка"));
            });
        }

        // 3. Если внутри coupleCard (двойная плашка)
        if (widget.leftCard && widget.leftCard.coupleCard) {
            const couple = widget.leftCard.coupleCard;
            if (couple.bottomItem) {
                const bStr = JSON.stringify(couple.bottomItem);
                if (bStr.includes("Кредит") || bStr.includes("кредит") || bStr.includes("1 000 000") || bStr.includes("1 000 000") || bStr.includes("Рассрочка")) {
                    delete couple.bottomItem;
                }
            }
        }
    } catch (e) {}

    return widget;
}

function shouldDeleteWidget(key, val) {
    const lowerKey = key.toLowerCase();

    // Заведомо рекламные префиксы
    if (isAdWidgetPrefix(key)) {
        return true;
    }

    const str = typeof val === "string" ? val : JSON.stringify(val);

    // «Поблагодарить продавца» / Чаевые
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

    // Баннеры кредитов в Ozon Банке
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
                const lowerKey = key.toLowerCase();

                // Если это виджет финансов - чистим его ХИРУРГИЧЕСКИ (удаляем кредитку, сохраняем счёт карты)
                if (lowerKey.startsWith("financewidget")) {
                    data.widgetStates[key] = cleanFinanceWidget(data.widgetStates[key]);
                    modified = true;
                    continue;
                }

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