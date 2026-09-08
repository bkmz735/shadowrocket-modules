/**
 * 🛡️ Ozon AdBlock & Smart Cleaner v5.0
 * 1. Блокирует рекламные баннеры, видео-рекламу, модалки, лотереи, промо кредитов и чаевые в layout.
 * 2. ОБЕЗВРЕЖИВАЕТ спонсорские товары (Ozon Трафареты):
 *    - Вычищает токены advertLite из click/view tracking
 *    - Удаляет рекламные метки из ссылок клика (advert=)
 *    - Удаляет визуальные плашки «Реклама» и «Спонсорский»
 *    - Сохраняет 100% стабильность сетки товаров (без нечетных плиток, без пустых дыр и провалов).
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

    // 1. Товарная сетка, каталоги и бесконечный скролл — НИ В КОЕМ СЛУЧАЕ НЕ УДАЛЯТЬ ИЗ LAYOUT!
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

// Умное обезвреживание рекламы внутри карточки товара
// Сохраняет целостность сетки 2х2, но вычищает все рекламные метки Ozon Трафаретов и трекинг кликов/показов
function neutralizeAdTile(tile) {
    if (!tile || typeof tile !== "object") return false;
    let modified = false;

    const target = (tile.product && typeof tile.product === "object") ? tile.product :
                   ((tile.productItem && typeof tile.productItem === "object") ? tile.productItem : tile);

    // 1. Очистка токенов Ozon Трафаретов (advertLite) и рекламных флагов в трекинге
    const tracking = target.cellTrackingInfo || target.trackingInfo || tile.cellTrackingInfo || tile.trackingInfo;
    if (tracking && typeof tracking === "object") {
        if (tracking.advertisement) { delete tracking.advertisement; modified = true; }
        if (tracking.isAdv) { delete tracking.isAdv; modified = true; }
        if (tracking.cpm) { delete tracking.cpm; modified = true; }
        if (tracking.advType) { delete tracking.advType; modified = true; }
        if (tracking.click && tracking.click.custom && tracking.click.custom.advertLite) {
            delete tracking.click.custom.advertLite;
            modified = true;
        }
        if (tracking.view && tracking.view.custom && tracking.view.custom.advertLite) {
            delete tracking.view.custom.advertLite;
            modified = true;
        }
    }

    // 2. Прямые флаги рекламы
    if (target.isSponsored) { delete target.isSponsored; modified = true; }
    if (target.sponsored) { delete target.sponsored; modified = true; }
    if (target.isAdv) { delete target.isAdv; modified = true; }
    if (target.adv) { delete target.adv; modified = true; }
    if (tile.isSponsored) { delete tile.isSponsored; modified = true; }
    if (tile.isAdv) { delete tile.isAdv; modified = true; }

    // 3. Очистка плашек «Реклама» и «Спонсорский» из badges
    const badges = target.badges || tile.badges;
    if (Array.isArray(badges)) {
        const origLen = badges.length;
        const filteredBadges = badges.filter(b => {
            const text = (typeof b === "string" ? b : (b.text || b.title || "")).toLowerCase();
            return !text.includes("реклама") && !text.includes("спонсор");
        });
        if (filteredBadges.length !== origLen) {
            if (target.badges) target.badges = filteredBadges;
            if (tile.badges) tile.badges = filteredBadges;
            modified = true;
        }
    }

    // 4. Очистка рекламных параметров из ссылок клика (advert=)
    const action = (target.common && target.common.action) || target.action || tile.action;
    if (action && typeof action === "object" && typeof action.link === "string") {
        if (action.link.indexOf("advert=") !== -1) {
            action.link = action.link.replace(/([?&])advert=[^&]*(&|$)/g, function(match, p1, p2) {
                return p2 === "&" ? p1 : "";
            }).replace(/\?$/, "");
            modified = true;
        }
    }

    return modified;
}

// Обезвреживание рекламных товаров в массивах виджета (tiles, products, searchResults)
function sanitizeTilesInWidget(val) {
    if (!val || typeof val !== "object") return false;
    let modified = false;

    const tileArrays = ["tiles", "products", "searchResults"];
    for (let a = 0; a < tileArrays.length; a++) {
        const arr = val[tileArrays[a]];
        if (Array.isArray(arr)) {
            for (let i = 0; i < arr.length; i++) {
                if (neutralizeAdTile(arr[i])) {
                    modified = true;
                }
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

        // 1. Очистка рекламных виджетов и обезвреживание Трафаретов в widgetStates (/page/json/v2)
        if (data.widgetStates && typeof data.widgetStates === "object") {
            for (const key of Object.keys(data.widgetStates)) {
                let widgetVal = data.widgetStates[key];
                let isParsed = false;

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
                    // Обезвреживаем Ozon Трафареты внутри сетки товаров без удаления самих товаров
                    if (sanitizeTilesInWidget(widgetVal)) {
                        if (isParsed) {
                            data.widgetStates[key] = JSON.stringify(widgetVal);
                        }
                        modified = true;
                    }
                }
            }
        }

        // 2. Очистка структуры /widget/json/v2
        if (data.state && typeof data.state === "object") {
            if (sanitizeTilesInWidget(data.state)) {
                modified = true;
            }
        }

        // 3. Очистка рекламных виджетов из дерева layout
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

            // 4. Схлопывание дублирующихся разделителей (separator, islandSeparator)
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

        // 5. Зачистка встроенных трекинговых полезных нагрузок
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
        isAdWidget,
        neutralizeAdTile,
        sanitizeTilesInWidget
    };
} else {
    $done({});
}