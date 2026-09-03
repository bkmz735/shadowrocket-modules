/**
 * 🫐 Wildberries AdBlock & Deep Cleaner for Shadowrocket
 * 
 * Очистка ответов мобильного приложения Wildberries:
 * 1. Вырезание рекламных флагов баннеров и навязчивых каруселей в apps-config
 * 2. Очистка промо-каруселей, баннеров и историй на главной и в разделах
 * 3. Очистка авторекламы / бустеров / рекламных карточек в поиске и каталоге
 */

const url = $request ? $request.url : "";
const body = (typeof $response !== "undefined" && $response.body) ? $response.body : null;

if (!body) {
    $done({});
} else {
    try {
        let modified = false;
        const data = JSON.parse(body);

        // =========================================================================
        // 1. Конфигурация приложения: apps-config.wildberries.ru
        // =========================================================================
        if (url.includes("apps-config.wildberries.ru/config/api/v2/reactive")) {
            if (data && data.reactive && typeof data.reactive === "object") {
                const bannerKeys = [
                    "enableNewBannerBank",
                    "enableNewBannerForce",
                    "enableNewBannerService",
                    "enableSoftBannerColForce",
                    "enableSoftBannerExpForce",
                    "enableNewFlowForPromocodes"
                ];

                for (const key of bannerKeys) {
                    if (data.reactive[key]) {
                        if (typeof data.reactive[key] === "object" && "enabled" in data.reactive[key]) {
                            data.reactive[key].enabled = false;
                            if (data.reactive[key].range) {
                                data.reactive[key].range.percentage = 0;
                            }
                            modified = true;
                        }
                    }
                }
            }
        } else if (url.includes("apps-config.wildberries.ru/config/api/v2/config")) {
            if (data && data.flags && typeof data.flags === "object") {
                const flagsToDisable = [
                    "allNewRecoSearchApiCarouselCP",
                    "bannerWbClubOn1SHKAbTesting",
                    "enableBrandBanners",
                    "enableCatalogInBanners",
                    "enableBankBanner"
                ];

                const flagsToEnable = [
                    "disableNapiBrandBanners",
                    "disableNapiCatalogInBanners",
                    "disableAllPageForSellerRecommendations"
                ];

                for (const flag of flagsToDisable) {
                    if (flag in data.flags) {
                        data.flags[flag] = false;
                        modified = true;
                    }
                }

                for (const flag of flagsToEnable) {
                    if (flag in data.flags) {
                        data.flags[flag] = true;
                        modified = true;
                    }
                }
            }
        }

        // =========================================================================
        // 2. Каталог, поиск и выдача товаров (napi / catalog.wb.ru / user-cards)
        // =========================================================================
        else if (
            url.includes("catalog.wb.ru") ||
            url.includes("napi.wildberries.ru") ||
            url.includes("user-cards.wb.ru") ||
            url.includes("/catalog/") ||
            url.includes("/search")
        ) {
            // Если в ответе структура с data.products или products
            const productsList = (data.data && Array.isArray(data.data.products)) 
                ? data.data.products 
                : (Array.isArray(data.products) ? data.products : null);

            if (productsList) {
                const initialLen = productsList.length;
                const filtered = productsList.filter(item => {
                    if (!item || typeof item !== "object") return true;

                    // Признаки рекламных товаров и бустеров WB
                    if (item.isPromo || item.isAdv || item.isAdvert || item.is_advert || item.advertId) {
                        return false;
                    }
                    if (item.log && (item.log.cpm || item.log.promoPosition || item.log.advertId)) {
                        return false;
                    }
                    if (item.badge && typeof item.badge === "string" && (item.badge.toLowerCase().includes("реклама") || item.badge.toLowerCase().includes("промо"))) {
                        return false;
                    }
                    return true;
                });

                if (filtered.length !== initialLen) {
                    if (data.data && Array.isArray(data.data.products)) {
                        data.data.products = filtered;
                    } else {
                        data.products = filtered;
                    }
                    modified = true;
                }
            }
        }

        // =========================================================================
        // 3. Баннеры, карусели и промо-блоки (banners-bt, promo, home-service)
        // =========================================================================
        else if (
            url.includes("banners") ||
            url.includes("promo") ||
            url.includes("carousel") ||
            url.includes("home-service")
        ) {
            // Если ответ возвращает список баннеров/каруселей
            if (Array.isArray(data)) {
                $done({ body: JSON.stringify([]) });
                return;
            } else if (data && typeof data === "object") {
                if (Array.isArray(data.banners)) {
                    data.banners = [];
                    modified = true;
                }
                if (Array.isArray(data.promo)) {
                    data.promo = [];
                    modified = true;
                }
                if (Array.isArray(data.items)) {
                    const before = data.items.length;
                    data.items = data.items.filter(item => {
                        if (!item) return true;
                        const type = String(item.type || item.kind || "").toLowerCase();
                        return !(type.includes("banner") || type.includes("promo") || type.includes("advert"));
                    });
                    if (data.items.length !== before) modified = true;
                }
            }
        }

        if (modified) {
            $done({ body: JSON.stringify(data) });
        } else {
            $done({});
        }
    } catch (e) {
        $done({});
    }
}
