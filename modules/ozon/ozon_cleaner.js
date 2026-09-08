/**
 * 🛡️ Ozon AdBlock & Deep Cleaner
 * Вырезание рекламы, баннеров, кредитов Ozon Банка, чаевых и спонсорских товаров (Трафареты)
 * с сохранением баланса Ozon Карты, истории заказов и блоков отзывов/оценки товаров.
 */

// Список префиксов виджетов, являющихся чистой рекламой
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
    "regulardraw",              // regulardraw.entryBannerWidget («Джекпот 5 млн» и лотереи)
    "skeeter.fintabbanner",     // skeeter.fintabBannerPriority (кредитные баннеры Ozon Банка)
    "rtb.advvideobannermobile", // rtb видеобаннеры
    "rtb.advrefreshwithdelay",  // rtb фоновые авторефреши рекламы
    "rateitems",                // «Поблагодарить продавца» (чаевые)
    "rpproduct.rateitems",      // «Поблагодарить продавца» в layout на главной
    "tipping"                   // чаевые продавцам
];

// Ключевые слова виджетов, которые ОБЯЗАТЕЛЬНО должны оставаться
// (Заказы, статус доставки, оценка купленных товаров, отзывы, финансы/баланс)
function isWhitelistedWidget(key) {
    if (!key) return false;
    const lower = key.toLowerCase();

    // 1. Финансы и баланс Ozon Карты
    if (lower.startsWith("financewidget") || lower.startsWith("financeheaderwidget")) {
        return true;
    }

    // 2. Блоки заказов и доставки
    // ВАЖНО: 'rate' и 'tipping' убраны из белого списка, чтобы не пропускать «Поблагодарить продавца»!
    if (
        lower.includes("order") ||         // userOrders, orderBanner, activeOrders, etc.
        lower.includes("delivery") ||      // статус доставки
        lower.includes("tracking") ||      // трекинг посылки
        lower.includes("purchase") ||      // покупки
        lower.includes("feedback") ||      // отзывы
        lower.includes("review")           // оставить отзыв к заказу
    ) {
        // Если это rateItems / tipping внутри заказа - не защищаем
        if (lower.includes("rateitem") || lower.includes("tipping")) {
            return false;
        }
        return true;
    }

    return false;
}

// Проверка, является ли ключ виджета рекламным
function isAdWidgetPrefix(key) {
    if (!key) return false;
    const lower = key.toLowerCase();
    for (let i = 0; i < AD_WIDGET_PREFIXES.length; i++) {
        if (lower.startsWith(AD_WIDGET_PREFIXES[i])) {
            return true;
        }
    }
    return false;
}

// Быстрая проверка на чаевые («поблагодарить продавца» / rateItems)
function isTippingWidget(key, val) {
    const lowerKey = key.toLowerCase();
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

// Проверка виджетов Ozon Банка на кредитные предложения
function isBankCreditWidget(key, val) {
    const lowerKey = key.toLowerCase();
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
    // 1. Белый список приоритетнее всего
    if (isWhitelistedWidget(key)) {
        return false;
    }

    // 2. Прямой матчинг по префиксам рекламы
    if (isAdWidgetPrefix(key)) {
        return true;
    }

    // 3. Чаевые («поблагодарить продавца»)
    if (isTippingWidget(key, val)) {
        return true;
    }

    // 4. Баннеры кредитов Ozon Банка
    if (isBankCreditWidget(key, val)) {
        return true;
    }

    return false;
}

// Определение, является ли элемент товара спонсорским / рекламой (Ozon Трафареты, Спонсорская полка)
function isSponsoredProductItem(item) {
    if (!item || typeof item !== "object") return false;

    // 1. Поддержка вложенных структур Composer:
    // - tileGrid2: { type: "product", product: {...} }
    // - widget/json: { type: "CONTENT_TYPE_PRODUCT_ITEM", productItem: {...} }
    const target = (item.product && typeof item.product === "object") ? item.product :
                   ((item.productItem && typeof item.productItem === "object") ? item.productItem : item);

    // 2. Прямые булевы флаги рекламы
    if (target.isSponsored || target.sponsored || target.isAdv || target.adv || item.isSponsored || item.sponsored || item.isAdv) {
        return true;
    }

    // 3. Главный маркер трафаретов Ozon из сниффера: advertLite
    const tracking = target.cellTrackingInfo || target.trackingInfo || item.cellTrackingInfo || item.trackingInfo;
    if (tracking && typeof tracking === "object") {
        if (tracking.isAdv || tracking.advertisement || tracking.cpm || tracking.advType) {
            return true;
        }
        // Вложенные структуры trackingInfo.click.custom.advertLite
        const clickCustom = tracking.click && tracking.click.custom;
        if (clickCustom && typeof clickCustom === "object" && clickCustom.advertLite) {
            return true;
        }
    }

    // 4. Проверка типа элемента
    const itemType = (item.type || item.itemType || target.type || target.itemType || "").toLowerCase();
    if (itemType.includes("adv") || itemType.includes("banner") || itemType.includes("sponsored")) {
        return true;
    }

    // 5. Проверка маркеров рекламы в badges
    const badges = target.badges || item.badges;
    if (Array.isArray(badges)) {
        for (let i = 0; i < badges.length; i++) {
            const b = badges[i];
            const text = (typeof b === "string" ? b : (b.text || b.title || "")).toLowerCase();
            if (text.includes("реклама") || text.includes("спонсор")) {
                return true;
            }
        }
    }

    // 6. Проверка наличия рекламных меток клика/трекинга
    const action = (target.common && target.common.action) || target.action || item.action;
    if (action && typeof action === "object") {
        const link = action.link || action.url || "";
        if (link.includes("adv_source") || link.includes("advertisement") || link.includes("cpm") || link.includes("advert=")) {
            return true;
        }
    }

    return false;
}

// Фильтрация рекламных товаров внутри поисковой выдачи, каталогов и полок
function filterItemsInWidgetState(state) {
    if (!state || typeof state !== "object") return false;
    let modified = false;

    // Массивы с товарами в Composer: items, products, tiles, searchResults, shelf
    const candidateArrays = ["items", "products", "tiles", "catalog", "elements"];
    for (let a = 0; a < candidateArrays.length; a++) {
        const arrName = candidateArrays[a];
        if (Array.isArray(state[arrName])) {
            const origLen = state[arrName].length;
            state[arrName] = state[arrName].filter(item => !isSponsoredProductItem(item));
            if (state[arrName].length !== origLen) {
                modified = true;
            }
        }
    }

    return modified;
}

function cleanOzonPayload(rawBody) {
    if (!rawBody) return rawBody;

    try {
        let data = JSON.parse(rawBody);
        let modified = false;

        const deletedWidgetKeys = new Set();

        // 1. Очистка структуры эндпоинта /widget/json/v2 (где нет widgetStates, а сразу { state: { items: [...] } })
        if (data.state && typeof data.state === "object") {
            if (filterItemsInWidgetState(data.state)) {
                modified = true;
            }
        }

        // 2. Очистка widgetStates в /page/json/v2 (удаление рекламных виджетов + фильтрация товаров)
        if (data.widgetStates && typeof data.widgetStates === "object") {
            for (const key of Object.keys(data.widgetStates)) {
                const widgetVal = data.widgetStates[key];

                if (shouldDeleteWidget(key, widgetVal)) {
                    delete data.widgetStates[key];
                    deletedWidgetKeys.add(key);
                    modified = true;
                } else {
                    // Очищаем рекламные спонсорские карточки внутри tileGrid, searchResults, полок
                    if (filterItemsInWidgetState(widgetVal)) {
                        modified = true;
                    }
                }
            }
        }

        // 3. Очистка дерева layout
        if (Array.isArray(data.layout)) {
            const initialLen = data.layout.length;

            data.layout = data.layout.filter(item => {
                const widgetKey = item.widgetKey || item.name || item.component || "";
                const lowerKey = widgetKey.toLowerCase();

                // Важные блоки оставляем обязательно
                if (isWhitelistedWidget(widgetKey)) {
                    return true;
                }

                if (
                    deletedWidgetKeys.has(widgetKey) ||
                    isAdWidgetPrefix(widgetKey) ||
                    lowerKey.includes("rateitem") ||
                    lowerKey.includes("tipping") ||
                    lowerKey.includes("fintabbannerpriority") ||
                    lowerKey.includes("advbanner") ||
                    lowerKey.includes("advvideobannermobile") ||
                    lowerKey.includes("entrybannerwidget") ||
                    lowerKey.includes("advrefreshwithdelay") ||
                    lowerKey.includes("regulardraw") ||
                    lowerKey.includes("creditpromo")
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

        // 4. Зачистка встроенной аналитики
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
        isSponsoredProductItem,
        isWhitelistedWidget
    };
} else {
    $done({});
}