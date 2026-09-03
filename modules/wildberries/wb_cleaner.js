/**
 * 🫐 Wildberries Ultra-Fast AdBlock & Cleaner
 * Быстрая и легкая очистка: не парсит тяжелые меню/карточки, мгновенно очищает баннеры и конфиг
 */

const url = $request ? $request.url : "";
const body = (typeof $response !== "undefined" && $response.body) ? $response.body : null;

if (!body) {
    $done({});
} else {
    try {
        // 1. Быстрое глушение баннеров на главной
        if (url.includes("banners-bt.wildberries.ru")) {
            $done({ body: JSON.stringify({ banners: [], promo: [], items: [] }) });
            return;
        }

        // 2. Лотереи и навязчивые информеры шансов
        if (url.includes("chances.wildberries.ru")) {
            $done({ body: JSON.stringify({}) });
            return;
        }

        // 3. Отключение рекламы в конфигурации приложения
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
                data.flags["disableNapiBrandBanners"] = true;
                data.flags["disableNapiCatalogInBanners"] = true;
                $done({ body: JSON.stringify(data) });
                return;
            }
        }

        // 4. Каталог и поиск (вырезание спонсорских товаров/бустеров)
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
