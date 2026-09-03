/**
 * 🕵️‍♂️ Ozon Ultimate Inspector & Text-Search Sniffer
 * Выводит подробное содержимое КАЖДОГО виджета:
 * Заголовки, тексты, кнопки, ссылки и точные ключи
 */

const url = $request ? $request.url : "";
const method = $request ? $request.method : "GET";

// Рекурсивный поиск всех текстовых строк внутри JSON объекта
function extractAllTexts(obj, collected = []) {
    if (!obj) return collected;
    if (typeof obj === "string") {
        if (obj.length > 2 && obj.length < 200 && !obj.startsWith("http") && !obj.startsWith("ozon://")) {
            collected.push(obj.trim());
        }
    } else if (Array.isArray(obj)) {
        for (const item of obj) {
            extractAllTexts(item, collected);
        }
    } else if (typeof obj === "object") {
        for (const k of Object.keys(obj)) {
            // Игнорируем технические ID и хеши
            if (["key", "id", "trackingInfo", "actionType", "token", "pageToken"].includes(k)) continue;
            extractAllTexts(obj[k], collected);
        }
    }
    return collected;
}

if (typeof $response !== "undefined" && $response.body) {
    try {
        const data = JSON.parse($response.body);
        let pathname = url.split("?")[0].replace(/^https?:\/\/[^\/]+/, "");
        let query = url.includes("?") ? url.split("?")[1] : "";

        console.log(`\n================== 🛰️ OZON WIDGET INSPECTOR ==================`);
        console.log(`📡 [PAGE]: ${pathname} ${query ? "?" + query.slice(0, 80) : ""}`);

        // 1. ПОЛНЫЙ РАЗБОР КАЖДОГО ВИДЖЕТА
        if (data.widgetStates && typeof data.widgetStates === "object") {
            const keys = Object.keys(data.widgetStates);
            console.log(`🧩 [TOTAL WIDGETS]: ${keys.length}`);

            keys.forEach((k, idx) => {
                const widgetObj = data.widgetStates[k];
                // Вытаскиваем человекочитаемые тексты
                const texts = extractAllTexts(widgetObj);
                const uniqueTexts = [...new Set(texts)].slice(0, 8); // Первые 8 текстов

                const rawSample = JSON.stringify(widgetObj).slice(0, 160);

                console.log(`\n  👉 #${idx + 1} [KEY]: ${k}`);
                if (uniqueTexts.length > 0) {
                    console.log(`     📝 [TEXTS]: "${uniqueTexts.join('" | "')}"`);
                } else {
                    console.log(`     ⚙️ [RAW]: ${rawSample}...`);
                }
            });
        }

        // 2. СТРУКТУРА LAYOUT
        if (Array.isArray(data.layout)) {
            const layoutOrder = data.layout.map(item => item.widgetKey || item.name || item.component || "?");
            console.log(`\n📐 [SCREEN ORDER]:\n${layoutOrder.map((name, i) => `   ${i + 1}. ${name}`).join("\n")}`);
        }

        console.log(`==============================================================\n`);

    } catch (e) {
        // не JSON
    }
}

$done({});