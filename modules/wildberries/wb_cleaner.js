/**
 * 🫐 Wildberries Cleaner v7 (Clean Layout & Best Stable Filters)
 */

(function () {
    const url = (typeof $request !== "undefined" && $request.url) ? $request.url : "";
    const body = (typeof $response !== "undefined" && $response.body) ? $response.body : null;

    if (!body) {
        $done({});
        return;
    }

    try {
        let modified = false;

        // =========================================================================
        // 1. Баннеры на главной, в ЛК и корзине (banners-bt.wildberries.ru)
        // =========================================================================
        if (url.includes("banners-bt.wildberries.ru")) {
            // В ЛК (/api/v3/account)
            if (url.includes("/account")) {
                $done({ body: JSON.stringify({ data: { banners: [] }, banners: [], items: [] }) });
                return;
            }

            // В корзине (/api/v1/basket)
            if (url.includes("/basket")) {
                $done({ body: JSON.stringify({ data: [], items: [], banners: [] }) });
                return;
            }

            // Главная страница (/api/v5/main)
            if (url.includes("/main")) {
                const data = JSON.parse(body);
                if (data && data.data && typeof data.data === "object") {
                    const wipeArrays = [
                        "smallTiles",
                        "middleTiles",
                        "bottomSlider",
                        "thxForOrderSF",
                        "brandsBanner",
                        "popups",
                        "small_sale",
                        "saleLabels",
                        "defaultBanner",
                        "placeholderBanner"
                    ];

                    for (let i = 0; i < wipeArrays.length; i++) {
                        const f = wipeArrays[i];
                        if (f in data.data) {
                            if (Array.isArray(data.data[f])) data.data[f] = [];
                            else data.data[f] = null;
                            modified = true;
                        }
                    }

                    // Верхний главный слайдер: вычищаем реальную рекламу (Миксит, Шейд, ОРД)
                    const sliderKeys = ["topSliderNF", "topSlider"];
                    for (let s = 0; s < sliderKeys.length; s++) {
                        const sk = sliderKeys[s];
                        if (Array.isArray(data.data[sk])) {
                            // Очищаем слайдер
                            data.data[sk] = [];
                            modified = true;
                        }
                    }

                    $done({ body: JSON.stringify(data) });
                    return;
                }
            }

            // Промо-страницы (/api/v2/promopages/mobile)
            if (url.includes("/promopages")) {
                const data = JSON.parse(body);
                if (data && Array.isArray(data.data)) {
                    data.data = data.data.filter(function (block) {
                        if (!block) return true;
                        if (Array.isArray(block.brandsBanner)) return false;
                        if (Array.isArray(block.saleLabels)) return false;
                        if (block.ordBannerMark || block.advParams) return false;
                        return true;
                    });
                    $done({ body: JSON.stringify(data) });
                    return;
                }
            }

            $done({ body: JSON.stringify({ data: {} }) });
            return;
        }

        // =========================================================================
        // 2. Личный кабинет (ui-bt.wildberries.ru/ui-bt/api/v1/profile)
        // =========================================================================
        if (url.includes("ui-bt.wildberries.ru/ui-bt/api/v1/profile")) {
            const data = JSON.parse(body);
            if (data && typeof data === "object") {
                // Если есть структура profile.widgets
                if (data.profile && Array.isArray(data.profile.widgets)) {
                    data.profile.widgets = data.profile.widgets.filter(function (w) {
                        if (!w) return true;
                        const type = String(w.type || "").toLowerCase();
                        const title = String(w.title || "").toLowerCase();
                        if (type.includes("banner") || type.includes("promo") || type.includes("advert")) return false;
                        if (title.includes("рассрочк") || title.includes("кредит") || title.includes("займ")) return false;
                        if (title.includes("здесь все") || title.includes("что вам нужно")) return false;
                        return true;
                    });
                    modified = true;
                }

                // Глубокая очистка любых других массивов профиля
                function deepClean(obj) {
                    if (!obj || typeof obj !== "object") return;
                    for (const k in obj) {
                        if (Array.isArray(obj[k])) {
                            obj[k] = obj[k].filter(function (item) {
                                if (!item || typeof item !== "object") return true;
                                const text = JSON.stringify(item).toLowerCase();
                                if (text.includes("миксит") || text.includes("шейд") || text.includes("mixit") || text.includes("shade")) return false;
                                if (text.includes("здесь все") || text.includes("здесь всё") || text.includes("что вам нужно")) return false;
                                if (text.includes("рассрочк") || text.includes("кредит") || text.includes("займ")) return false;
                                const type = String(item.type || item.kind || "").toLowerCase();
                                if (type.includes("banner") || type.includes("promo") || type.includes("advert")) return false;
                                return true;
                            });
                        } else if (typeof obj[k] === "object") {
                            deepClean(obj[k]);
                        }
                    }
                }
                deepClean(data);

                $done({ body: JSON.stringify(data) });
                return;
            }
        }

        // =========================================================================
        // 3. Выдача товаров и лента (api-ios.wildberries.ru / catalog.wb.ru)
        // =========================================================================
        if (
            url.includes("api-ios.wildberries.ru") ||
            url.includes("catalog.wb.ru") ||
            url.includes("/catalog/") ||
            url.includes("/search")
        ) {
            const data = JSON.parse(body);
            let list = null;
            if (data && data.data && Array.isArray(data.data.products)) list = data.data.products;
            else if (data && Array.isArray(data.products)) list = data.products;

            if (list) {
                const filtered = list.filter(function (item) {
                    if (!item || typeof item !== "object") return true;
                    if (item.isPromo || item.isAdv || item.isAdvert || item.is_advert || item.advertId) return false;
                    if (item.log && (item.log.cpm || item.log.promoPosition || item.log.advertId)) return false;
                    const badge = String(item.badge || "").toLowerCase();
                    if (badge.includes("реклама") || badge.includes("промо")) return false;
                    return true;
                });

                if (data.data && Array.isArray(data.data.products)) data.data.products = filtered;
                else data.products = filtered;

                $done({ body: JSON.stringify(data) });
                return;
            }
        }

        // =========================================================================
        // 4. Розыгрыши и лотереи ("Шансы")
        // =========================================================================
        if (url.includes("chances.wildberries.ru")) {
            $done({ body: JSON.stringify([]) });
            return;
        }

        // =========================================================================
        // 5. Рассрочки и подписки
        // =========================================================================
        if (url.includes("installments-aggregator-bt.wildberries.ru")) {
            $done({ body: JSON.stringify({ installmentProduct: null, status: "success" }) });
            return;
        }

        if (url.includes("gateway-subscriptions")) {
            $done({ body: JSON.stringify({ data: [], subscriptions: [] }) });
            return;
        }

        $done({});
    } catch (e) {
        $done({});
    }
})();
