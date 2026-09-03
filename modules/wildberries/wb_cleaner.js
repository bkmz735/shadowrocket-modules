/**
 * 🫐 Wildberries AdBlock & Deep Cleaner
 * 
 * Точечная зачистка:
 * 1. banners-bt.wildberries.ru:
 *    - Полное удаление баннеров (/v5/main, /v3/account, /v2/promopages)
 *    - Заглушка дефолтного баннера-плейсхолдера ("Здесь всё, что вам нужно")
 * 2. api-ios.wildberries.ru / catalog.wb.ru:
 *    - Вырезка рекламных блоков и спонсорских товаров среди ленты товаров
 * 3. ui-bt.wildberries.ru & banners-bt /v3/account:
 *    - Вырезка рекламных слайдеров в ЛК (ООО Шейд, ООО Миксит, баннеры в профиле)
 * 4. chances.wildberries.ru:
 *    - Глушение лотерей и розыгрышей
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
            // В ЛК (/api/v3/account) — именно здесь крутятся "ООО Шейд", "ООО Миксит" в профиле!
            if (url.includes("/account")) {
                $done({ body: JSON.stringify({ data: {}, banners: [], items: [] }) });
                return;
            }

            // В корзине (/api/v1/basket)
            if (url.includes("/basket")) {
                $done({ body: JSON.stringify({ data: [], items: [], banners: [] }) });
                return;
            }

            // Главная страница (/api/v5/main)
            // Возвращаем пустую data: {}, чтобы iOS-клиент полностью скрыл верхний контейнер каруселей без плейсхолдера
            if (url.includes("/main")) {
                $done({ body: JSON.stringify({ data: {} }) });
                return;
            }

            // Промо-страницы (/api/v2/promopages/mobile)
            if (url.includes("/promopages")) {
                const data = JSON.parse(body);
                if (data && Array.isArray(data.data)) {
                    data.data = data.data.filter(function (block) {
                        if (!block) return true;
                        if (Array.isArray(block.brandsBanner)) return false;
                        if (Array.isArray(block.saleLabels)) return false;
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
                function deepCleanProfile(obj) {
                    if (!obj || typeof obj !== "object") return;
                    for (const k in obj) {
                        if (Array.isArray(obj[k])) {
                            obj[k] = obj[k].filter(function (item) {
                                if (!item || typeof item !== "object") return true;
                                const text = JSON.stringify(item).toLowerCase();
                                if (text.includes("миксит") || text.includes("шейд") || text.includes("mixit") || text.includes("shade")) return false;
                                if (text.includes("рассрочк") || text.includes("кредит") || text.includes("займ")) return false;
                                const type = String(item.type || item.kind || "").toLowerCase();
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
            // Проверяем список товаров
            let list = null;
            if (data && data.data && Array.isArray(data.data.products)) list = data.data.products;
            else if (data && Array.isArray(data.products)) list = data.products;

            if (list) {
                const filtered = list.filter(function (item) {
                    if (!item || typeof item !== "object") return true;
                    // Автореклама, спонсорские бустеры, бейджи промо
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
