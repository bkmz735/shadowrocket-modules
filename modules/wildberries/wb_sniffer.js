/**
 * 🫐 Wildberries Inspector - Low Memory & Targeted
 * Перехватывает ТОЛЬКО баннеры и главный экран
 */

const url = $request ? $request.url : "";
const body = (typeof $response !== "undefined" && $response.body) ? $response.body : null;

// Перехватываем ТОЛЬКО banners-bt и home-service
if (body && (url.includes("banners-bt") || url.includes("home-service/api/v1/home"))) {
    try {
        const data = JSON.parse(body);
        console.log(`\n================== [WB TARGET HIT: ${url}] ==================`);

        if (url.includes("banners-bt")) {
            // Анализ баннеров
            const banners = Array.isArray(data) ? data : (data.banners || data.items || data.promo || []);
            console.log(`[BANNERS COUNT]: ${banners.length}`);
            banners.slice(0, 15).forEach((b, i) => {
                const title = b.title || b.name || b.header || b.text || "Без названия";
                const urlTarget = b.actionUrl || b.link || b.url || "";
                const type = b.type || b.kind || "";
                console.log(`  🎯 Баннер #${i + 1}: "${title}" | Type: ${type} | Link: ${urlTarget}`);
            });
        } else if (url.includes("home")) {
            // Анализ блоков главной страницы
            console.log(`[HOME DATA KEYS]: ${JSON.stringify(Object.keys(data.data || data))}`);
            if (data.data) {
                for (const k in data.data) {
                    if (Array.isArray(data.data[k])) {
                        console.log(`  -> Секция "${k}": ${data.data[k].length} элементов`);
                    }
                }
            }
        }
        console.log(`=============================================================\n`);
    } catch (e) {}
}

$done({});
