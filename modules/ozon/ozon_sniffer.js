/**
 * 🕵️‍♂️ Ozon Forensic Product & Grid Inspector
 * Целевой сниффер для глубокого анализа структуры карточек товаров (tileGrid2, searchResults, полок):
 * - Логирует ключи виджетов и количество плиток
 * - Выводит подробную структуру каждого товара/плитки:
 *   - Заголовок товара
 *   - Поля трекинга (trackingInfo, cellTrackingInfo, advertLite, cpm, advType)
 *   - Бейджи и плашки ("Реклама", "Спонсорский" и т.п.)
 *   - Ссылки и экшены (adv_source, advert= и т.п.)
 *   - Тип элемента (type, itemType, template)
 */

const url = typeof $request !== "undefined" && $request.url ? $request.url : "";
const method = typeof $request !== "undefined" && $request.method ? $request.method : "GET";

if (typeof $response !== "undefined" && $response.body) {
    try {
        const bodyStr = $response.body;

        // Фильтруем телеметрию, трекеры и лишний шум
        const isTelemetry = url.includes("/p-api/") || url.includes("/trackEvent") || url.includes("dlte");
        
        if (!isTelemetry && (url.includes("page/json") || url.includes("widget/json"))) {
            const data = JSON.parse(bodyStr);

            // Вспомогательная функция для детального инспектирования карточки товара
            function inspectProductTile(tile, idx, widgetKey) {
                if (!tile || typeof tile !== "object") return;

                const target = (tile.product && typeof tile.product === "object") ? tile.product :
                               ((tile.productItem && typeof tile.productItem === "object") ? tile.productItem : tile);

                const title = target.title || (target.mainState && JSON.stringify(target.mainState).slice(0, 100)) || "";
                const tileType = tile.type || target.type || "";
                
                // Маркеры рекламы
                const tracking = target.cellTrackingInfo || target.trackingInfo || tile.cellTrackingInfo || tile.trackingInfo || {};
                const clickCustom = (tracking.click && tracking.click.custom) || {};
                const badges = target.badges || tile.badges || [];
                const action = (target.common && target.common.action) || target.action || tile.action || {};
                const actionLink = action.link || action.url || "";

                // Проверяем наличие подозрительных или рекламных флагов
                const markers = [];
                if (target.isSponsored || tile.isSponsored) markers.push("isSponsored");
                if (target.isAdv || tile.isAdv) markers.push("isAdv");
                if (tracking.advertisement) markers.push("advertisement");
                if (tracking.cpm) markers.push("cpm");
                if (tracking.advType) markers.push("advType=" + tracking.advType);
                if (clickCustom.advertLite) markers.push("advertLite=" + JSON.stringify(clickCustom.advertLite));
                if (actionLink.includes("advert") || actionLink.includes("cpm") || actionLink.includes("adv_source")) {
                    markers.push("actionLink=" + actionLink.slice(0, 80));
                }

                console.log(`    📦 [${idx}] Type: "${tileType}" | Title: "${title.slice(0, 40)}"`);
                if (markers.length > 0) {
                    console.log(`       🚨 AD_MARKERS: ${markers.join(" | ")}`);
                }
                console.log(`       🔎 Tracking keys: [${Object.keys(tracking).join(", ")}]`);
                if (Object.keys(clickCustom).length > 0) {
                    console.log(`       🔎 click.custom keys: [${Object.keys(clickCustom).join(", ")}]`);
                }
                if (Array.isArray(badges) && badges.length > 0) {
                    console.log(`       🏷 Badges: ${JSON.stringify(badges)}`);
                }
            }

            console.log(`\n================== [🕵️‍♂️ OZON GRID FORENSIC] ==================`);
            console.log(`📡 ${method} ${url}`);

            // 1. Анализ widgetStates
            if (data.widgetStates && typeof data.widgetStates === "object") {
                for (const key of Object.keys(data.widgetStates)) {
                    let val = data.widgetStates[key];
                    if (typeof val === "string") {
                        try { val = JSON.parse(val); } catch (e) {}
                    }

                    if (val && typeof val === "object") {
                        const tiles = val.tiles || val.products || val.searchResults;
                        if (Array.isArray(tiles) && tiles.length > 0) {
                            console.log(`\n  🔑 GRID WIDGET: ${key} (Всего товаров: ${tiles.length})`);
                            tiles.forEach((t, i) => inspectProductTile(t, i, key));
                        }
                    }
                }
            }

            // 2. Анализ /widget/json
            if (data.state && typeof data.state === "object") {
                const tiles = data.state.tiles || data.state.items || data.state.products;
                if (Array.isArray(tiles) && tiles.length > 0) {
                    console.log(`\n  🔑 SINGLE STATE WIDGET (Всего товаров: ${tiles.length})`);
                    tiles.forEach((t, i) => inspectProductTile(t, i, "single_state"));
                }
            }

            console.log(`=============================================================\n`);
        }
    } catch (err) {
        console.log(`❌ Grid Sniffer error: ${err.message}`);
    }
}

$done({});