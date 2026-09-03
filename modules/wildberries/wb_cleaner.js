/**
 * Wildberries Cleaner v8 (Full Ad/ORD/Promo/Installment Cleaner)
 * 
 * Обработчики (в порядке приоритета):
 *   1. banners-bt  — главная, корзина, ЛК, промо-страницы
 *   2. ui-bt       — профиль (виджеты, баннеры, рассрочки)
 *   3. /card/cards — карточки товаров (ОРД/ЕРИД, бустеры, промо)
 *   4. catalog/search/recom — выдача, поиск, рекомендации, блендер
 *   5. chances     — розыгрыши
 *   6. installments/subscriptions — рассрочки и подписки
 *   7. apps-config — конфиги приложения (промо-фичи, попапы)
 */

(function () {
    const url = (typeof $request !== "undefined" && $request.url) ? $request.url : "";
    const body = (typeof $response !== "undefined" && $response.body) ? $response.body : null;

    if (!body) {
        $done({});
        return;
    }

    try {

        // =====================================================================
        // 1. Баннеры (banners-bt.wildberries.ru)
        // =====================================================================
        if (url.includes("banners-bt.wildberries.ru")) {

            // ЛК (/api/v3/account)
            if (url.includes("/account")) {
                $done({ body: JSON.stringify({ data: { banners: [] }, banners: [], items: [] }) });
                return;
            }

            // Корзина (/api/v1/basket) — занулить баннеры, сохранить структуру
            if (url.includes("/basket")) {
                const data = safeJSON(body);
                if (data) {
                    wipeKeys(data, ["banners", "items", "topBanners", "bottomBanners"]);
                    $done({ body: JSON.stringify(data) });
                } else {
                    $done({ body: JSON.stringify({ data: [], items: [], banners: [] }) });
                }
                return;
            }

            // Главная (/api/v5/main)
            if (url.includes("/main")) {
                const data = safeJSON(body);
                if (data && data.data && typeof data.data === "object") {
                    const wipe = [
                        "smallTiles", "middleTiles", "bottomSlider",
                        "thxForOrderSF", "brandsBanner", "popups",
                        "small_sale", "saleLabels", "defaultBanner",
                        "placeholderBanner", "topSliderNF", "topSlider",
                        "stories", "bigBanners", "promoCards"
                    ];
                    for (var i = 0; i < wipe.length; i++) {
                        if (wipe[i] in data.data) {
                            data.data[wipe[i]] = Array.isArray(data.data[wipe[i]]) ? [] : null;
                        }
                    }
                    $done({ body: JSON.stringify(data) });
                    return;
                }
            }

            // Промо-страницы (/api/v2/promopages/mobile)
            if (url.includes("/promopages")) {
                const data = safeJSON(body);
                if (data && Array.isArray(data.data)) {
                    data.data = data.data.filter(function (b) {
                        if (!b) return true;
                        if (Array.isArray(b.brandsBanner)) return false;
                        if (Array.isArray(b.saleLabels)) return false;
                        if (b.ordBannerMark || b.advParams) return false;
                        return true;
                    });
                    $done({ body: JSON.stringify(data) });
                    return;
                }
            }

            // Любые другие эндпоинты banners-bt — убиваем
            $done({ body: JSON.stringify({ data: {} }) });
            return;
        }

        // =====================================================================
        // 2. Профиль / ЛК (ui-bt.wildberries.ru)
        // =====================================================================
        if (url.includes("ui-bt.wildberries.ru")) {
            const data = safeJSON(body);
            if (data && typeof data === "object") {
                // Виджеты профиля
                if (data.profile && Array.isArray(data.profile.widgets)) {
                    data.profile.widgets = data.profile.widgets.filter(function (w) {
                        if (!w) return true;
                        var type = lo(w.type || w.kind);
                        var title = lo(w.title);
                        if (type.includes("banner") || type.includes("promo") || type.includes("advert")) return false;
                        if (title.includes("рассрочк") || title.includes("кредит") || title.includes("займ")) return false;
                        if (title.includes("здесь все") || title.includes("что вам нужно")) return false;
                        return true;
                    });
                }
                deepCleanAds(data);
                $done({ body: JSON.stringify(data) });
                return;
            }
        }

        // =====================================================================
        // 3. Карточки товаров (/card/cards/) — ОРД/ЕРИД, бустеры, промо
        // =====================================================================
        if (url.includes("/card/cards/")) {
            const data = safeJSON(body);
            if (data) {
                // Массив products
                var products = (data.data && Array.isArray(data.data.products))
                    ? data.data.products
                    : Array.isArray(data.products) ? data.products : null;

                if (products) {
                    for (var i = 0; i < products.length; i++) {
                        var p = products[i];
                        if (!p || typeof p !== "object") continue;
                        // Вырезаем рекламные метки
                        stripAdFields(p);
                        // Глубокая очистка вложенных рекламных блоков
                        var promoKeys = [
                            "promotions", "promoBanners", "adverts",
                            "advertBanners", "advertisements", "promoTextCard",
                            "ordBannerMark", "ord_mark", "advParams"
                        ];
                        for (var j = 0; j < promoKeys.length; j++) {
                            if (promoKeys[j] in p) delete p[promoKeys[j]];
                        }
                    }
                }

                // Рекомендации «похожие товары» внутри карточки
                var similar = (data.data && data.data.similar) ? data.data.similar : data.similar;
                if (Array.isArray(similar)) {
                    var clean = filterAdProducts(similar);
                    if (data.data && data.data.similar) data.data.similar = clean;
                    else if (data.similar) data.similar = clean;
                }

                $done({ body: JSON.stringify(data) });
                return;
            }
        }

        // =====================================================================
        // 4. Выдача, поиск, рекомендации, блендер
        // =====================================================================
        if (
            url.includes("api-ios.wildberries.ru") ||
            url.includes("catalog.wb.ru") ||
            url.includes("/catalog/") ||
            url.includes("/search") ||
            url.includes("/recom/")
        ) {
            const data = safeJSON(body);
            if (!data) { $done({}); return; }

            // products
            var list = (data.data && Array.isArray(data.data.products))
                ? data.data.products
                : Array.isArray(data.products) ? data.products : null;

            if (list) {
                var filtered = filterAdProducts(list);
                if (data.data && Array.isArray(data.data.products)) data.data.products = filtered;
                else data.products = filtered;
                $done({ body: JSON.stringify(data) });
                return;
            }

            // items (блендер / карусели / preview)
            if (data.data && Array.isArray(data.data.items)) {
                data.data.items = filterAdProducts(data.data.items);
                $done({ body: JSON.stringify(data) });
                return;
            }

            // widgets / blocks (персональные виджеты рекомендаций)
            if (data.data && Array.isArray(data.data.widgets)) {
                data.data.widgets = data.data.widgets.filter(function (w) {
                    if (!w) return true;
                    var t = lo(w.type || w.kind);
                    if (t.includes("advert") || t.includes("promo") || t.includes("banner")) return false;
                    return true;
                });
                // Также почистим items внутри каждого виджета
                data.data.widgets.forEach(function (w) {
                    if (w && Array.isArray(w.items)) {
                        w.items = filterAdProducts(w.items);
                    }
                });
                $done({ body: JSON.stringify(data) });
                return;
            }

            $done({ body: JSON.stringify(data) });
            return;
        }

        // =====================================================================
        // 5. Розыгрыши и лотереи
        // =====================================================================
        if (url.includes("chances.wildberries.ru")) {
            $done({ body: JSON.stringify([]) });
            return;
        }

        // =====================================================================
        // 6. Рассрочки и подписки
        // =====================================================================
        if (url.includes("installments-aggregator-bt.wildberries.ru")) {
            $done({ body: JSON.stringify({ installmentProduct: null, status: "success" }) });
            return;
        }

        if (url.includes("gateway-subscriptions")) {
            $done({ body: JSON.stringify({ data: [], subscriptions: [] }) });
            return;
        }

        // =====================================================================
        // 7. Конфиги приложения (apps-config) — отключаем промо-фичи
        // =====================================================================
        if (url.includes("apps-config.wildberries.ru")) {
            const data = safeJSON(body);
            if (data) {
                // Отключаем известные промо-флаги
                var promoFlags = [
                    "showPromo", "showBanners", "showStories",
                    "showLottery", "showInstallments", "showSpecials",
                    "enableAds", "enableAdvert", "promoEnabled"
                ];
                function disableFlags(obj) {
                    if (!obj || typeof obj !== "object") return;
                    for (var k in obj) {
                        if (promoFlags.indexOf(k) !== -1 && typeof obj[k] === "boolean") {
                            obj[k] = false;
                        } else if (typeof obj[k] === "object") {
                            disableFlags(obj[k]);
                        }
                    }
                }
                disableFlags(data);
                $done({ body: JSON.stringify(data) });
                return;
            }
        }

        $done({});

    } catch (e) {
        $done({});
    }

    // ─── Утилиты ─────────────────────────────────────────────────────────

    function safeJSON(str) {
        try { return JSON.parse(str); } catch (e) { return null; }
    }

    function lo(s) {
        return String(s || "").toLowerCase();
    }

    /** Зануляет массивы/объекты по списку ключей */
    function wipeKeys(obj, keys) {
        if (!obj || typeof obj !== "object") return;
        for (var i = 0; i < keys.length; i++) {
            if (keys[i] in obj) {
                obj[keys[i]] = Array.isArray(obj[keys[i]]) ? [] : null;
            }
        }
    }

    /** Удаляет рекламные поля из объекта товара */
    function stripAdFields(p) {
        if (p.isPromo) p.isPromo = false;
        if (p.isAdvert) p.isAdvert = false;
        if (p.isAdv) p.isAdv = false;
        if (p.is_advert) p.is_advert = false;
        if (p.advertId) delete p.advertId;
        if (p.advParams) delete p.advParams;
        if (p.ordBannerMark) delete p.ordBannerMark;
        if (p.ord_mark) delete p.ord_mark;
        if (p.log) {
            if (p.log.cpm) delete p.log.cpm;
            if (p.log.promoPosition) delete p.log.promoPosition;
            if (p.log.advertId) delete p.log.advertId;
        }
    }

    /** Фильтрует массив товаров/элементов от рекламных позиций */
    function filterAdProducts(list) {
        return list.filter(function (item) {
            if (!item || typeof item !== "object") return true;
            if (item.isPromo || item.isAdv || item.isAdvert || item.is_advert || item.advertId) return false;
            if (item.ordBannerMark || item.advParams) return false;
            if (item.log && (item.log.cpm || item.log.promoPosition || item.log.advertId)) return false;
            var badge = lo(item.badge);
            if (badge.includes("реклама") || badge.includes("промо")) return false;
            var title = lo(item.title || item.name);
            if (title.includes("реклама")) return false;
            return true;
        });
    }

    /** Глубокая рекурсивная очистка рекламных элементов */
    function deepCleanAds(obj) {
        if (!obj || typeof obj !== "object") return;
        for (var k in obj) {
            if (Array.isArray(obj[k])) {
                obj[k] = obj[k].filter(function (item) {
                    if (!item || typeof item !== "object") return true;
                    var text = JSON.stringify(item).toLowerCase();
                    if (text.includes("миксит") || text.includes("шейд") || text.includes("mixit") || text.includes("shade")) return false;
                    if (text.includes("здесь все") || text.includes("здесь всё") || text.includes("что вам нужно")) return false;
                    if (text.includes("рассрочк") || text.includes("кредит") || text.includes("займ")) return false;
                    var type = lo(item.type || item.kind);
                    if (type.includes("banner") || type.includes("promo") || type.includes("advert")) return false;
                    return true;
                });
            } else if (typeof obj[k] === "object") {
                deepCleanAds(obj[k]);
            }
        }
    }

})();