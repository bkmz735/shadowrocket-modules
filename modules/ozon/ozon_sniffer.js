/**
 * 🕵️‍♂️ Ozon Ultra-Light Smart Sniffer v2.0
 * Диагностический инструмент разведки для поиска:
 * - Эндпоинтов, обращений и экшенов API
 * - Диплинков приложения (ozon://...) и промо-ссылок
 * - Купонов, промокодов, розыгрышей, бонусов и акций
 * - Рекламных виджетов и спонсорских карточек ("Трафаретов")
 * 
 * ⚡ Оптимизирован под лимиты памяти iOS Network Extension (Jetsam 15-30 МБ):
 * - Мгновенный сброс телеметрии без парсинга JSON
 * - Лимит размера тела (макс. 1.5 МБ для парсинга)
 * - Контролируемая глубина обхода объектов (без утечек стека и памяти)
 * - Дедупликация и лимиты находок (макс. 5-7 ссылок на запрос)
 * - Консолидированный компактный лог (один console.log на запрос, макс. 2 КБ)
 */

const url = typeof $request !== "undefined" && $request.url ? $request.url : "";
const method = typeof $request !== "undefined" && $request.method ? $request.method : "GET";

(function runSniffer() {
    if (typeof $response === "undefined" || !$response.body || !url) {
        $done({});
        return;
    }

    // 1. Быстрый фильтр шума (телеметрия, пиксели, аналитика, бинарные данные) — 0% оверхеда памяти
    const lowerUrl = url.toLowerCase();
    if (
        lowerUrl.includes("/p-api/") ||
        lowerUrl.includes("/trackevent") ||
        lowerUrl.includes("perf-metrics") ||
        lowerUrl.includes("sentry") ||
        lowerUrl.includes("dlte") ||
        lowerUrl.includes(".png") ||
        lowerUrl.includes(".jpg") ||
        lowerUrl.includes(".webp") ||
        lowerUrl.includes(".svg")
    ) {
        $done({});
        return;
    }

    const bodyStr = $response.body;

    // 2. Защита от перегрузки памяти iOS: пропускаем гигантские ответы (> 1.5 МБ)
    if (bodyStr.length > 1572864) {
        console.log(`⚠️ [OZON SNIFFER] Пропущен слишком большой ответ (${(bodyStr.length / 1024 / 1024).toFixed(1)} МБ): ${url.slice(0, 80)}`);
        $done({});
        return;
    }

    try {
        const data = JSON.parse(bodyStr);
        if (!data || typeof data !== "object") {
            $done({});
            return;
        }

        // Коллекторы находок с жесткими лимитами
        const deeplinks = new Set();
        const promoActions = new Set();
        const coupons = [];
        const adWidgetsFound = new Set();
        let totalTiles = 0;
        let sponsoredTiles = 0;
        const sampleSponsoredTitles = [];

        // 3. Быстрый рекурсивный сканер для поиска диплинков, ссылок и промокодов (макс. глубина 4, макс. 300 узлов)
        let visitedNodes = 0;
        function scanNode(node, depth) {
            if (!node || typeof node !== "object" || depth > 4 || visitedNodes > 300) return;
            visitedNodes++;

            if (Array.isArray(node)) {
                for (let i = 0; i < node.length && i < 30; i++) {
                    scanNode(node[i], depth + 1);
                }
                return;
            }

            for (const key of Object.keys(node)) {
                const val = node[key];
                if (typeof val === "string") {
                    // Поиск диплинков ozon://
                    if (val.startsWith("ozon://") && deeplinks.size < 5) {
                        deeplinks.add(val);
                    }
                    // Поиск промо-ссылок и экшенов
                    else if ((val.includes("_action/") || val.includes("/highlight/") || val.includes("/promo/")) && promoActions.size < 5) {
                        promoActions.add(val.slice(0, 100));
                    }

                    // Поиск купонов и промокодов
                    const lk = key.toLowerCase();
                    if ((lk.includes("promocode") || lk.includes("couponcode") || lk === "code") && val.length >= 3 && val.length <= 25) {
                        if (coupons.length < 4 && !coupons.some(c => c.code === val)) {
                            coupons.push({ code: val, title: node.title || node.name || node.text || key });
                        }
                    }
                } else if (typeof val === "object" && val !== null) {
                    scanNode(val, depth + 1);
                }
            }
        }

        scanNode(data, 0);

        // 4. Анализ виджетов и структуры страницы (если это page/json или widget/json)
        if (data.widgetStates && typeof data.widgetStates === "object") {
            for (const key of Object.keys(data.widgetStates)) {
                const lk = key.toLowerCase();

                // Детект рекламных виджетов
                if (
                    lk.includes("advbanner") ||
                    lk.includes("promobanner") ||
                    lk.includes("brandshelf") ||
                    lk.includes("advshelf") ||
                    lk.includes("regulardraw") ||
                    lk.includes("fintab") ||
                    lk.includes("billboard") ||
                    lk.includes("tipping") ||
                    lk.includes("rateitem")
                ) {
                    if (adWidgetsFound.size < 6) {
                        adWidgetsFound.add(key.split("-")[0]);
                    }
                }

                // Детект спонсорских карточек товаров (Трафареты)
                let val = data.widgetStates[key];
                if (typeof val === "string" && (val.includes("advertLite") || val.includes("isSponsored") || val.includes("tiles") || val.includes("products"))) {
                    try { val = JSON.parse(val); } catch (e) {}
                }

                if (val && typeof val === "object") {
                    const tiles = val.tiles || val.products || val.searchResults || val.items;
                    if (Array.isArray(tiles)) {
                        totalTiles += tiles.length;
                        for (let i = 0; i < tiles.length; i++) {
                            const t = tiles[i];
                            const target = (t && t.product) ? t.product : ((t && t.productItem) ? t.productItem : t);
                            if (!target || typeof target !== "object") continue;

                            const tracking = target.cellTrackingInfo || target.trackingInfo || t.cellTrackingInfo || t.trackingInfo || {};
                            const clickCustom = (tracking.click && tracking.click.custom) || {};
                            const action = (target.common && target.common.action) || target.action || t.action || {};
                            const actionLink = action.link || action.url || "";

                            const isAd = target.isSponsored || t.isSponsored || target.isAdv || t.isAdv ||
                                         tracking.advertisement || tracking.cpm || tracking.advType ||
                                         clickCustom.advertLite || actionLink.includes("advert=");

                            if (isAd) {
                                sponsoredTiles++;
                                if (sampleSponsoredTitles.length < 2) {
                                    const title = target.title || "Товар #" + i;
                                    sampleSponsoredTitles.push(title.slice(0, 35));
                                }
                            }
                        }
                    }
                }
            }
        }

        // 5. Формируем компактный консолидированный лог (только если найдено что-то полезное)
        const hasFindings = deeplinks.size > 0 || promoActions.size > 0 || coupons.length > 0 ||
                            adWidgetsFound.size > 0 || totalTiles > 0 || url.includes("_action/");

        if (hasFindings) {
            // Извлекаем чистый URL или внутренний путь страницы
            let pageRoute = "";
            const pageMatch = url.match(/url=([^&]+)/);
            if (pageMatch) {
                try { pageRoute = decodeURIComponent(pageMatch[1]); } catch (e) { pageRoute = pageMatch[1]; }
            } else {
                const uObj = url.split("?")[0].replace("https://api.ozon.ru", "");
                pageRoute = uObj.slice(0, 60);
            }

            const lines = [];
            lines.push(`\n🔎 [OZON SNIFFER] ${method} ${pageRoute}`);

            if (deeplinks.size > 0) {
                lines.push(`  🔗 Диплинки (${deeplinks.size}):`);
                deeplinks.forEach(dl => lines.push(`     → ${dl}`));
            }

            if (coupons.length > 0) {
                lines.push(`  🎟 Купоны/Промокоды (${coupons.length}):`);
                coupons.forEach(c => lines.push(`     → [${c.code}] ${c.title}`));
            }

            if (promoActions.size > 0) {
                lines.push(`  ⚡ Ссылки/Экшены (${promoActions.size}):`);
                promoActions.forEach(a => lines.push(`     → ${a}`));
            }

            if (adWidgetsFound.size > 0) {
                lines.push(`  📢 Рекламные виджеты: [${Array.from(adWidgetsFound).join(", ")}]`);
            }

            if (totalTiles > 0) {
                lines.push(`  📦 Сетка товаров: всего ${totalTiles} (Органика: ${totalTiles - sponsoredTiles}, Трафареты: ${sponsoredTiles})`);
                if (sampleSponsoredTitles.length > 0) {
                    lines.push(`     Примеры спонсорских: "${sampleSponsoredTitles.join('", "')}"`);
                }
            }

            // Единый атомарный вывод в лог (не забивает буфер и память консоли)
            console.log(lines.join("\n"));
        }

    } catch (err) {
        // Защита от падений скрипта: тихо завершаем без утечек
    } finally {
        $done({});
    }
})();