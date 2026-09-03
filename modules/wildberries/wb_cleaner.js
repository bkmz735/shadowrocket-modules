/**
 * 🫐 Wildberries Cleaner v5 (Anti-Placeholder & Anti-Banner)
 * Полное удаление баннеров, ОРД-рекламы и дефолтных заглушек "Здесь есть всё"
 */

(function () {
    const url = (typeof $request !== "undefined" && $request.url) ? $request.url : "";
    const body = (typeof $response !== "undefined" && $response.body) ? $response.body : null;

    if (!body) {
        $done({});
        return;
    }

    try {
        // =========================================================================
        // 1. Баннеры на главной, в ЛК и корзине (banners-bt.wildberries.ru)
        // =========================================================================
        if (url.includes("banners-bt.wildberries.ru")) {
            // В ЛК (/api/v3/account)
            if (url.includes("/account")) {
                $done({ body: JSON.stringify({ data: null, banners: null, items: [] }) });
                return;
            }

            // В корзине (/api/v1/basket)
            if (url.includes("/basket")) {
                $done({ body: JSON.stringify({ data: null, items: [], banners: null }) });
                return;
            }

            // Главная страница (/api/v5/main)
            if (url.includes("/main")) {
                try {
                    const data = JSON.parse(body);
                    if (data && data.data && typeof data.data === "object") {
                        // Поля рекламных баннеров и слайдеров
                        const adFields = [
                            "topSliderNF",
                            "topSlider",
                            "smallTiles",
                            "middleTiles",
                            "bottomSlider",
                            "thxForOrderSF",
                            "brandsBanner",
                            "popups",
                            "defaultBanner",
                            "placeholderBanner",
                            "small_sale",
                            "saleLabels"
                        ];

                        for (let i = 0; i < adFields.length; i++) {
                            const f = adFields[i];
                            if (f in data.data) {
                                // Если удалить ключ или поставить null, клиент не находит массив баннеров и не крутит карусель
                                delete data.data[f];
                            }
                        }

                        // Убираем флаги плейсхолдера
                        if ("hasBanners" in data.data) data.data.hasBanners = false;
                        if ("showBanners" in data.data) data.data.showBanners = false;

                        $done({ body: JSON.stringify(data) });
                        return;
                    }
                } catch (err) {
                    $done({ body: JSON.stringify({ data: null }) });
                    return;
                }
            }

            // Промо-страницы (/api/v2/promopages/mobile)
            if (url.includes("/promopages")) {
                try {
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
                } catch (e) {}
            }

            $done({ body: JSON.stringify({ data: null }) });
            return;
        }

        // =========================================================================
        // 2. Личный кабинет (ui-bt.wildberries.ru/ui-bt/api/v1/profile)
        // =========================================================================
        if (url.includes("ui-bt.wildberries.ru/ui-bt/api/v1/profile")) {
            try {
                const data = JSON.parse(body);
                if (data && typeof data === "object") {
                    function deepCleanProfile(obj) {
                        if (!obj || typeof obj !== "object") return;
                        for (const k in obj) {
                            if (Array.isArray(obj[k])) {
                                obj[k] = obj[k].filter(function (item) {
                                    if (!item || typeof item !== "object") return true;
                                    const text = JSON.stringify(item).toLowerCase();
                                    // Реклама брендов
                                    if (text.includes("миксит") || text.includes("шейд") || text.includes("mixit") || text.includes("shade")) return false;
                                    // Заглушка
                                    if (text.includes("здесь все") || text.includes("здесь всё") || text.includes("что вам нужно")) return false;
                                    // Кредиты / рассрочки
                                    if (text.includes("рассрочк") || text.includes("кредит") || text.includes("займ")) return false;
                                    const type = String(item.type || item.kind || item.blockType || "").toLowerCase();
                                    if (type.includes("banner") || type.includes("promo") || type.includes("advert")) return false;
                                    return true;
                                });
                            } else if (typeof obj[k] === "object") {
                                deepCleanProfile(obj[k]);
                            }
                        }
                    }
                    deepCleanProfile(data);
                    $done({ body: JSON.stringify(data) });
                    return;
                }
            } catch (e) {}
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
            try {
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
            } catch (e) {}
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
