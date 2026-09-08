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
        const prefix = AD_WIDGET_PREFIXES[i];
        if (lower.startsWith(prefix) || lower.includes("." + prefix) || lower.includes(prefix)) {
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

    // 4. Проверка типа элемента (только явные рекламные типы, исключая обычный product)
    const rawType = item.type || item.itemType || target.type || target.itemType || "";
    const lowerType = rawType.toLowerCase();
    if (
        lowerType.startsWith("adv") ||
        lowerType.startsWith("ad") ||
        lowerType.includes("sponsored") ||
        lowerType === "banner" ||
        lowerType.startsWith("banner")
    ) {
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

// Проверка, опустел ли виджет полностью после вырезки рекламных карточек
function isWidgetCompletelyEmpty(state) {
    if (!state || typeof state !== "object") return false;
    const candidateArrays = ["items", "products", "tiles", "catalog", "elements"];
    let foundArray = false;
    for (let a = 0; a < candidateArrays.length; a++) {
        const arr = state[candidateArrays[a]];
        if (Array.isArray(arr)) {
            foundArray = true;
            if (arr.length > 0) {
                return false; // Есть полезные товары!
            }
        }
    }
    // Если в виджете были массивы товаров, но теперь они все пустые (length === 0)
    return foundArray;
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
                let widgetVal = data.widgetStates[key];
                let isParsed = false;

                // Ozon Composer Engine часто упаковывает состояние каждого виджета в JSON-строку!
                if (typeof widgetVal === "string") {
                    try {
                        widgetVal = JSON.parse(widgetVal);
                        isParsed = true;
                    } catch (e) {}
                }

                if (shouldDeleteWidget(key, widgetVal)) {
                    delete data.widgetStates[key];
                    deletedWidgetKeys.add(key);
                    modified = true;
                } else if (widgetVal && typeof widgetVal === "object") {
                    // Очищаем рекламные спонсорские карточки внутри tileGrid, searchResults, полок
                    if (filterItemsInWidgetState(widgetVal)) {
                        // Если в результате фильтрации виджет/полка опустели полностью - удаляем его совсем!
                        // Чтобы в приложении не оставалось пустых "дыр" и серых блоков
                        if (isWidgetCompletelyEmpty(widgetVal)) {
                            delete data.widgetStates[key];
                            deletedWidgetKeys.add(key);
                        } else if (isParsed) {
                            // Если остались полезные органические товары - сериализуем обратно
                            data.widgetStates[key] = JSON.stringify(widgetVal);
                        }
                        modified = true;
                    }
                }
            }
        }

        // 3. Очистка дерева layout
        if (Array.isArray(data.layout)) {
            const initialLen = data.layout.length;

            data.layout = data.layout.filter(item => {
                const widgetKey = item.widgetKey || "";
                const stateId = item.stateId || "";
                const component = item.component || "";
                const name = item.name || "";

                // Проверяем все возможные идентификаторы элемента в layout
                const identifiers = [widgetKey, stateId, component, name].filter(Boolean);

                // Если хоть один идентификатор в белом списке - оставляем
                for (let i = 0; i < identifiers.length; i++) {
                    if (isWhitelistedWidget(identifiers[i])) {
                        return true;
                    }
                }

                // Проверяем на удаление
                for (let i = 0; i < identifiers.length; i++) {
                    const id = identifiers[i];
                    const lowerId = id.toLowerCase();

                    if (
                        deletedWidgetKeys.has(id) ||
                        isAdWidgetPrefix(id) ||
                        lowerId.includes("rateitem") ||
                        lowerId.includes("tipping") ||
                        lowerId.includes("fintabbannerpriority") ||
                        lowerId.includes("advbanner") ||
                        lowerId.includes("advvideobannermobile") ||
                        lowerId.includes("entrybannerwidget") ||
                        lowerId.includes("advrefreshwithdelay") ||
                        lowerId.includes("regulardraw") ||
                        lowerId.includes("creditpromo")
                    ) {
                        return false;
                    }
                }

                return true;
            });

            // Очистка разделителей (separator, islandSeparator)
            // 1. Убираем любые идущие подряд разделители любого типа
            let cleanedLayout = [];
            for (let i = 0; i < data.layout.length; i++) {
                const cur = data.layout[i];
                const curComp = (cur.component || cur.name || cur.widgetKey || cur.stateId || "").toLowerCase();
                const isSep = curComp.includes("separator");

                if (isSep && cleanedLayout.length > 0) {
                    const prev = cleanedLayout[cleanedLayout.length - 1];
                    const prevComp = (prev.component || prev.name || prev.widgetKey || prev.stateId || "").toLowerCase();
                    if (prevComp.includes("separator")) {
                        continue; // Схлопываем подряд идущие разделители
                    }
                }
                cleanedLayout.push(cur);
            }

            // 2. Убираем висящие разделители в самом начале или в самом конце массива
            while (cleanedLayout.length > 0) {
                const first = cleanedLayout[0];
                const firstComp = (first.component || first.name || first.widgetKey || first.stateId || "").toLowerCase();
                if (firstComp.includes("separator")) {
                    cleanedLayout.shift();
                } else {
                    break;
                }
            }
            while (cleanedLayout.length > 0) {
                const last = cleanedLayout[cleanedLayout.length - 1];
                const lastComp = (last.component || last.name || last.widgetKey || last.stateId || "").toLowerCase();
                if (lastComp.includes("separator")) {
                    cleanedLayout.pop();
                } else {
                    break;
                }
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