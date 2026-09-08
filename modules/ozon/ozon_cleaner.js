/**
 * 🛡️ Ozon AdBlock & Clean Layout
 * Блокировка рекламных баннеров, видео-рекламы, лотерей, кредитных промо Ozon Банка и чаевых.
 * Сохраняет полную целостность сетки товаров (tileGrid2), баланс Ozon Карты и историю заказов.
 */

// Список ключевых идентификаторов виджетов, являющихся чистой рекламой
const AD_WIDGET_PREFIXES = [
    "advbanner",
    "adbanner",
    "promobanner",
    "dvbanner",
    "advvideobannermobile",
    "entrybannerwidget",
    "advrefreshwithdelay",
    "adcarousel",
    "billboard",
    "advshelf",
    "advtile",
    "brandshelf",
    "badgelist",                // рекламные подборки в ленте
    "regulardraw",              // regulardraw.entryBannerWidget («Джекпот 5 млн» и лотереи)
    "skeeter.fintabbanner",     // кредитные баннеры Ozon Банка
    "fintabbannerpriority",
    "rtb.advvideobannermobile", // rtb видеобаннеры
    "rtb.advrefreshwithdelay",  // rtb фоновые авторефреши рекламы
    "rateitems",                // «Поблагодарить продавца» (чаевые)
    "rpproduct.rateitems",      // «Поблагодарить продавца» на главной
    "tipping"                   // чаевые продавцам
];

// Белый список виджетов, которые ОБЯЗАТЕЛЬНО должны оставаться
function isWhitelistedWidget(key) {
    if (!key) return false;
    const lower = key.toLowerCase();

    // 1. Товарная сетка, каталоги и бесконечный скролл — НИ В КОЕМ СЛУЧАЕ НЕ ТРОГАЕМ!
    if (
        lower.includes("tilegrid") ||
        lower.includes("infinitescroll") ||
        lower.includes("searchresults") ||
        lower.includes("scrollanchor") ||
        lower.includes("navigationslider") ||
        lower.includes("navbar") ||
        lower.includes("searchbar")
    ) {
        return true;
    }

    // 2. Финансы и баланс Ozon Карты
    if (lower.startsWith("financewidget") || lower.startsWith("financeheaderwidget")) {
        return true;
    }

    // 3. Блоки заказов и доставки
    if (
        lower.includes("order") ||
        lower.includes("delivery") ||
        lower.includes("tracking") ||
        lower.includes("purchase") ||
        lower.includes("feedback") ||
        lower.includes("review")
    ) {
        // Если это rateItems / tipping внутри блока заказа — не защищаем
        if (lower.includes("rateitem") || lower.includes("tipping")) {
            return false;
        }
        return true;
    }

    return false;
}

// Проверка, является ли ключ виджета рекламным
function isAdWidget(key) {
    if (!key) return false;
    const lower = key.toLowerCase();

    // Если в белом списке — никогда не удаляем
    if (isWhitelistedWidget(key)) {
        return false;
    }

    for (let i = 0; i < AD_WIDGET_PREFIXES.length; i++) {
        const prefix = AD_WIDGET_PREFIXES[i];
        if (
            lower === prefix ||
            lower.startsWith(prefix + "-") ||
            lower.startsWith(prefix + ".") ||
            lower.startsWith(prefix + "_") ||
            lower.includes("." + prefix) ||
            lower.includes(prefix)
        ) {
            return true;
        }
    }
    return false;
}

// Быстрая проверка на чаевые («поблагодарить продавца» / rateItems)
function isTippingWidget(key, val) {
    const lowerKey = (key || "").toLowerCase();
    if (
        lowerKey.includes("rateitem") ||
        lowerKey.includes("tipping") ||
        lowerKey.includes("tips") ||
        lowerKey.startsWith("rpproduct.rateitems")
    ) {
        return true;
    }

    if (val && typeof val === "object") {
        const textToCheck = (val.title || "") + " " + (val.header || "") + " " + (val.text || "") + " " + (val.actionText || "");
        if (/поблагодарить|чаевые|tips|благодарност/i.test(textToCheck)) {
            return true;
        }
    }
    return false;
}

// Проверка виджетов Ozon Банка на кредитные промо-баннеры
function isBankCreditWidget(key, val) {
    const lowerKey = (key || "").toLowerCase();
    if (lowerKey.includes("adbanner") || lowerKey.includes("fintabbannerpriority")) {
        return true;
    }
    if (val && typeof val === "object") {
        const str = (val.title || "") + " " + (val.subtitle || "") + " " + (val.text || "");
        if (str.includes("500 000") || /кредит|продлить лето|рассрочк/i.test(str)) {
            return true;
        }
    }
    return false;
}

// Определение, нужно ли удалить весь виджет
function shouldDeleteWidget(key, val) {
    if (isWhitelistedWidget(key)) {
        return false;
    }
    if (isAdWidget(key)) {
        return true;
    }
    if (isTippingWidget(key, val)) {
        return true;
    }
    if (isBankCreditWidget(key, val)) {
        return true;
    }
    return false;
}

function cleanOzonPayload(rawBody) {
    if (!rawBody) return rawBody;

    try {
        let data = JSON.parse(rawBody);
        let modified = false;

        const deletedWidgetKeys = new Set();

        // 1. Очистка рекламных виджетов в widgetStates (/page/json/v2)
        if (data.widgetStates && typeof data.widgetStates === "object") {
            for (const key of Object.keys(data.widgetStates)) {
                let widgetVal = data.widgetStates[key];

                // Распаковываем JSON-строку только для проверки содержимого
                if (typeof widgetVal === "string") {
                    try {
                        widgetVal = JSON.parse(widgetVal);
                    } catch (e) {}
                }

                if (shouldDeleteWidget(key, widgetVal)) {
                    delete data.widgetStates[key];
                    deletedWidgetKeys.add(key);
                    modified = true;
                }
            }
        }

        // 2. Очистка рекламных виджетов из дерева layout
        if (Array.isArray(data.layout)) {
            const initialLen = data.layout.length;

            data.layout = data.layout.filter(item => {
                const widgetKey = item.widgetKey || "";
                const stateId = item.stateId || "";
                const component = item.component || "";
                const name = item.name || "";

                const identifiers = [widgetKey, stateId, component, name].filter(Boolean);

                // Если хоть один идентификатор в белом списке — гарантированно оставляем
                for (let i = 0; i < identifiers.length; i++) {
                    if (isWhitelistedWidget(identifiers[i])) {
                        return true;
                    }
                }

                // Проверяем на удаление
                for (let i = 0; i < identifiers.length; i++) {
                    const id = identifiers[i];
                    if (deletedWidgetKeys.has(id) || isAdWidget(id)) {
                        return false;
                    }
                }

                return true;
            });

            // 3. Схлопывание дублирующихся разделителей (separator, islandSeparator)
            let cleanedLayout = [];
            for (let i = 0; i < data.layout.length; i++) {
                const cur = data.layout[i];
                const curComp = (cur.component || cur.name || cur.widgetKey || cur.stateId || "").toLowerCase();
                const isSep = curComp.includes("separator");

                if (isSep && cleanedLayout.length > 0) {
                    const prev = cleanedLayout[cleanedLayout.length - 1];
                    const prevComp = (prev.component || prev.name || prev.widgetKey || prev.stateId || "").toLowerCase();
                    if (prevComp.includes("separator")) {
                        continue; // Схлопываем идущие подряд разделители
                    }
                }
                cleanedLayout.push(cur);
            }

            data.layout = cleanedLayout;

            if (data.layout.length !== initialLen) {
                modified = true;
            }
        }

        // 4. Зачистка встроенных трекинговых полезных нагрузок
        if (data.trackingPayloads) {
            delete data.trackingPayloads;
            modified = true;
        }

        return modified ? JSON.stringify(data) : rawBody;

    } catch (e) {
        return rawBody;
    }
}

// Запуск в среде Shadowrocket
if (typeof $response !== "undefined" && $response.body) {
    const cleaned = cleanOzonPayload($response.body);
    $done({ body: cleaned });
} else if (typeof module !== "undefined" && module.exports) {
    // Экспорт для unit-тестирования
    module.exports = {
        cleanOzonPayload,
        shouldDeleteWidget,
        isWhitelistedWidget,
        isAdWidget
    };
} else {
    $done({});
}