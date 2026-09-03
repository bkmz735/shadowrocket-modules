/**
 * 🫐 Wildberries Bulletproof Cleaner
 * Устраняет баннеры, карусели, розыгрыши и рекламу WB.
 * Обернут в самовызывающуюся функцию (IIFE), чтобы return работал корректно в JSCore iOS.
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

        // 1. Главные баннеры и карусели (banners-bt.wildberries.ru)
        if (url.includes("banners-bt.wildberries.ru")) {
            const data = JSON.parse(body);

            // Главный слайдер акций (/api/v5/main)
            if (data && data.data && typeof data.data === "object") {
                const adFields = [
                    "topSliderNF",
                    "topSlider",
                    "smallTiles",
                    "thxForOrderSF",
                    "brandsBanner",
                    "middleTiles",
                    "bottomSlider",
                    "popups"
                ];

                for (let i = 0; i < adFields.length; i++) {
                    const f = adFields[i];
                    if (Array.isArray(data.data[f]) && data.data[f].length > 0) {
                        data.data[f] = [];
                        modified = true;
                    }
                }
            }

            // Промо-страницы (/api/v2/promopages/mobile)
            if (data && Array.isArray(data.data)) {
                data.data = data.data.filter(function (block) {
                    if (!block) return true;
                    if (Array.isArray(block.brandsBanner)) return false;
                    if (Array.isArray(block.saleLabels)) return false;
                    return true;
                });
                modified = true;
            }

            // Баннеры в корзине (/api/v1/basket)
            if (url.includes("/basket")) {
                $done({ body: JSON.stringify({ data: [], items: [], banners: [] }) });
                return;
            }

            if (modified) {
                $done({ body: JSON.stringify(data) });
                return;
            }
        }

        // 2. Лотереи и розыгрыши ("Шансы")
        if (url.includes("chances.wildberries.ru")) {
            $done({ body: JSON.stringify([]) });
            return;
        }

        // 3. Рассрочки и кредиты WB Банка
        if (url.includes("installments-aggregator-bt.wildberries.ru")) {
            $done({ body: JSON.stringify({ installmentProduct: null, status: "success" }) });
            return;
        }

        // 4. Навязывание платных подписок (WB Клуб)
        if (url.includes("gateway-subscriptions")) {
            $done({ body: JSON.stringify({ data: [], subscriptions: [] }) });
            return;
        }

        // 5. Конфигурация реактивных фичей (apps-config)
        if (url.includes("apps-config.wildberries.ru/config/api/v2/reactive")) {
            const data = JSON.parse(body);
            if (data && data.reactive) {
                const bannerKeys = [
                    "enableNewBannerBank",
                    "enableNewBannerForce",
                    "enableNewBannerService",
                    "enableSoftBannerColForce",
                    "enableSoftBannerExpForce",
                    "enableNewFlowForPromocodes"
                ];
                for (let i = 0; i < bannerKeys.length; i++) {
                    const k = bannerKeys[i];
                    if (data.reactive[k] && typeof data.reactive[k] === "object") {
                        data.reactive[k].enabled = false;
                        if (data.reactive[k].range) data.reactive[k].range.percentage = 0;
                        modified = true;
                    }
                }
            }
            if (modified) {
                $done({ body: JSON.stringify(data) });
                return;
            }
        }

        if (url.includes("apps-config.wildberries.ru/config/api/v2/config")) {
            const data = JSON.parse(body);
            if (data && data.flags) {
                data.flags["allNewRecoSearchApiCarouselCP"] = false;
                data.flags["bannerWbClubOn1SHKAbTesting"] = false;
                data.flags["enableBrandBanners"] = false;
                data.flags["enableBankBanner"] = false;
                data.flags["disableNapiBrandBanners"] = true;
                data.flags["disableNapiCatalogInBanners"] = true;
                data.flags["disableAllPageForSellerRecommendations"] = true;
                $done({ body: JSON.stringify(data) });
                return;
            }
        }

        // 6. Личный кабинет (ЛК)
        if (url.includes("ui-bt.wildberries.ru/ui-bt/api/v1/profile")) {
            const data = JSON.parse(body);
            if (data && data.profile && Array.isArray(data.profile.widgets)) {
                data.profile.widgets = data.profile.widgets.filter(function (w) {
                    if (!w) return true;
                    const type = String(w.type || "").toLowerCase();
                    const title = String(w.title || "").toLowerCase();
                    return !(type.includes("banner") || type.includes("promo") || title.includes("кредит") || title.includes("рассрочк"));
                });
                $done({ body: JSON.stringify(data) });
                return;
            }
        }

        $done({});
    } catch (e) {
        $done({});
    }
})();
