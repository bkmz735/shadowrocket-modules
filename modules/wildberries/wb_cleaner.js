/**
 * 🫐 Wildberries AdBlock & Deep Cleaner
 * Вырезает:
 * 1. Главную карусель и баннеры акций (banners-bt)
 * 2. Баннеры кредитов/рассрочек WB Банка и лотереи ("Шансы")
 * 3. Рекламные виджеты и промо-баннеры в Личном Кабинете (ЛК)
 * 4. Конфигурационные флаги рекламы и каруселей (apps-config)
 * 5. Рекомендательные блоки и спонсорские товары в каталоге/поиске
 */

const url = $request ? $request.url : "";
const body = (typeof $response !== "undefined" && $response.body) ? $response.body : null;

if (!body) {
    $done({});
} else {
    try {
        // =========================================================================
        // 1. Баннеры и промо-акции на главной: banners-bt.wildberries.ru
        // =========================================================================
        if (url.includes("banners-bt.wildberries.ru")) {
            // Возвращаем пустую структуру баннеров
            $done({ body: JSON.stringify({ banners: [], promo: [], items: [], data: [] }) });
            return;
        }

        // =========================================================================
        // 2. Лотереи, колесо фортуны и розыгрыши ("Шансы"): chances.wildberries.ru
        // =========================================================================
        if (url.includes("chances.wildberries.ru")) {
            $done({ body: JSON.stringify({}) });
            return;
        }

        // =========================================================================
        // 3. Рассрочки и кредиты WB Банка: installments-aggregator-bt
        // =========================================================================
        if (url.includes("installments-aggregator-bt.wildberries.ru")) {
            $done({ body: JSON.stringify({ status: "success", data: [] }) });
            return;
        }

        // =========================================================================
        // 4. Личный Кабинет (ЛК / Профиль): ui-bt.wildberries.ru/ui-bt/api/v1/profile
        // =========================================================================
        if (url.includes("ui-bt.wildberries.ru/ui-bt/api/v1/profile")) {
            const data = JSON.parse(body);
            let modified = false;

            function cleanSection(items) {
                if (!Array.isArray(items)) return items;
                return items.filter(item => {
                    if (!item) return true;
                    const type = String(item.type || item.kind || "").toLowerCase();
                    const title = String(item.title || item.header || item.name || "").toLowerCase();
                    const link = String(item.actionUrl || item.link || "").toLowerCase();

                    // Вырезаем баннеры, промо-акции, оформление кредитов/рассрочек в ЛК
                    if (type.includes("banner") || type.includes("promo") || type.includes("advert")) return false;
                    if (title.includes("рассрочк") || title.includes("кредит") || title.includes("займ")) return false;
                    if (link.includes("installment") || link.includes("credit") || link.includes("banner")) return false;

                    return true;
                });
            }

            if (data && data.data && typeof data.data === "object") {
                for (const key in data.data) {
                    if (Array.isArray(data.data[key])) {
                        data.data[key] = cleanSection(data.data[key]);
                        modified = true;
                    }
                }
            } else if (data && typeof data === "object") {
                for (const key in data) {
                    if (Array.isArray(data[key])) {
                        data[key] = cleanSection(data[key]);
                        modified = true;
                    }
                }
            }

            if (modified) {
                $done({ body: JSON.stringify(data) });
                return;
            }
        }

        // =========================================================================
        // 5. Конфигурация приложения: apps-config.wildberries.ru
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
                    }
                }
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
        // 6. Каталог и поиск (вырезание спонсорских товаров и бустеров)
        // =========================================================================
        if (url.includes("catalog.wb.ru") || url.includes("/search")) {
            const data = JSON.parse(body);
            const products = data.data && Array.isArray(data.data.products) ? data.data.products : (Array.isArray(data.products) ? data.products : null);
            if (products) {
                const filtered = products.filter(item => {
                    if (!item) return true;
                    if (item.isPromo || item.isAdv || item.isAdvert || item.advertId) return false;
                    if (item.log && (item.log.cpm || item.log.promoPosition || item.log.advertId)) return false;
                    return true;
                });
                if (data.data && Array.isArray(data.data.products)) {
                    data.data.products = filtered;
                } else {
                    data.products = filtered;
                }
                $done({ body: JSON.stringify(data) });
                return;
            }
        }

        $done({});
    } catch (e) {
        $done({});
    }
}
