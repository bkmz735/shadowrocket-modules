/**
 * 🫐 Wildberries Safe Bulletproof Sniffer
 * Никаких падений VPN:
 * - Жесткий игнор спама journal-bt, a.wb.ru, sentry, antibot, locator, картинок
 * - Лимит длины лога (до 500 символов)
 * - Показывает URL, метод и реальные текстовые блоки рекламы/баннеров/меню
 */

const url = $request ? $request.url : "";
const method = $request ? $request.method : "GET";
const body = (typeof $response !== "undefined" && $response.body) ? $response.body : null;

// Черный список шумных эндпоинтов (чтобы сниффер не жрал память)
const NOISE = [
    "journal-bt",
    "a.wb.ru",
    "marketplace-sentry",
    "antibot",
    "locator",
    "courses/rub.json",
    "points-bt",
    "points.wb.ru",
    "upstreams",
    "ping"
];

if (body && !NOISE.some(n => url.includes(n))) {
    try {
        const data = JSON.parse(body);

        console.log(`\n================== [WB SAFE SNIFFER] ==================`);
        console.log(`[URL]: ${method} ${url}`);

        // Ищем тексты, названия, баннеры
        const itemsFound = [];

        function scan(obj, path, depth) {
            if (!obj || typeof obj !== "object" || depth > 4 || itemsFound.length > 20) return;

            if (Array.isArray(obj)) {
                obj.slice(0, 10).forEach((item, idx) => {
                    if (item && typeof item === "object") {
                        const title = item.title || item.name || item.header || item.text || "";
                        const sub = item.subTitle || item.subtitle || item.description || "";
                        const type = item.type || item.kind || item.blockType || "";
                        const link = item.actionUrl || item.link || item.url || "";
                        if (title || type || link) {
                            itemsFound.push(`[${path}[${idx}]] Type: "${type}" | Title: "${String(title).slice(0, 50)}" | Link: "${String(link).slice(0, 60)}"`);
                        }
                    }
                });
            } else {
                for (const k in obj) {
                    if (typeof obj[k] === "object") {
                        scan(obj[k], path ? `${path}.${k}` : k, depth + 1);
                    }
                }
            }
        }

        scan(data, "", 0);

        if (itemsFound.length > 0) {
            console.log(`[ЭЛЕМЕНТЫ (${itemsFound.length})]:`);
            itemsFound.forEach(it => console.log(`  -> ${it}`));
        } else {
            const rootKeys = Array.isArray(data) ? `Array[${data.length}]` : Object.keys(data).slice(0, 10).join(", ");
            console.log(`[ROOT]: ${rootKeys}`);
        }

        console.log(`========================================================\n`);
    } catch (e) {}
}

$done({});
