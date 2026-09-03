/**
 * 🫐 Wildberries Deep AdBlocker & Cleaner
 * Полная очистка на основе перехваченных структур:
 * - topSliderNF, topSlider, smallTiles, thxForOrderSF в banners-bt/v5/main
 * - brandsBanner и saleLabels в promopages/mobile
 * - баннеры корзины api/v1/basket
 * - лотереи и шансы в chances.wildberries.ru
 * - подписки WB Клуб в gateway-subscriptions
 * - рассрочки в installments-aggregator-bt
 */

const url = $request ? $request.url : "";
const body = (typeof $response !== "undefined" && $response.body) ? $response.body : null;

if (!body) {
    $done({});
} else {
    try {
        let modified = false;

        // =========================================================================
        // 1. Главные баннеры и промо-слайдеры (banners-bt.wildberries.ru)
        // =========================================================================
        if (url.includes("banners-bt.wildberries.ru")) {
            const data = JSON.parse(body);

            // /api/v5/main — верхний слайдер, плитки, баннеры после заказа
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

                for (const field of adFields) {
                    if (Array.isArray(data.data[field]) && data.data[field].length > 0) {
                        data.data[field] = [];
                        modified = true;
                    }
                }
            }

            // /api/v2/promopages/mobile — промо-страницы, брендовые баннеры
            if (data && Array.isArray(data.data)) {
                data.data = data.data.filter(block => {
                    if (!block) return true;
                    // Если блок содержит brandsBanner или рекламные saleLabels
                    if (Array.isArray(block.brandsBanner)) return false;
                    if (Array.isArray(block.saleLabels)) return false;
                    return true;
                });
                modified = true;
            }

            // /api/v1/basket — баннеры в корзине
            if (url.includes("/basket")) {
                $done({ body: JSON.stringify({ data: [], items: [], banners: [] }) });
                return;
            }

            if (modified) {
                $done({ body: JSON.stringify(data) });
                return;
            }
        }

        // =========================================================================
        // 2. Розыгрыши, шансы и лотереи (chances.wildberries.ru)
        // =========================================================================
        if (url.includes("chances.wildberries.ru")) {
            // Возвращаем пустой массив, чтобы плашка розыгрыша не показывалась
            $done({ body: JSON.stringify([]) });
            return;
        }

        // =========================================================================
        // 3. Рассрочки и кредиты WB Банка (installments-aggregator-bt)
        // =========================================================================
        if (url.includes("installments-aggregator-bt.wildberries.ru")) {
            $done({ body: JSON.stringify({ installmentProduct: null, status: "success" }) });
            return;
        }

        // =========================================================================
        // 4. Навязывание подписок (gateway-subscriptions.common.geo.paywb.com)
        // =========================================================================
        if (url.includes("gateway-subscriptions")) {
            $done({ body: JSON.stringify({ data: [], subscriptions: [] }) });
            return;
        }

        // =========================================================================
        // 5. Конфигурация фичей (apps-config.wildberries.ru)
        // =========================================================================
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
                for (const key of bannerKeys) {
                    if (data.reactive[key] && typeof data.reactive[key] === "object") {
                        data.reactive[key].enabled = false;
                        if (data.reactive[key].range) data.reactive[key].range.percentage = 0;
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

        // =========================================================================
        // 6. Личный кабинет (ui-bt.wildberries.ru/ui-bt/api/v1/profile)
        // =========================================================================
        if (url.includes("ui-bt.wildberries.ru/ui-bt/api/v1/profile")) {
            const data = JSON.parse(body);
            if (data && data.profile && Array.isArray(data.profile.widgets)) {
                data.profile.widgets = data.profile.widgets.filter(w => {
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
}
