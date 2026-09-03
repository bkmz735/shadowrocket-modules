/**
 * 🫐 Wildberries Traffic & Ads Sniffer for Shadowrocket
 * Перехватывает и детально выводит структуру JSON ответов мобильного приложения WB:
 * - Каталог и поисковая выдача
 * - Главная страница, карусели, промо-баннеры
 * - Рекламные блоки и автореклама (бустеры)
 * - Аналитика и трекинг
 */

const url = $request ? $request.url : "";
const method = $request ? $request.method : "GET";
const body = (typeof $response !== "undefined" && $response.body) ? $response.body : null;

if (body) {
    try {
        const data = JSON.parse(body);

        console.log(`\n================== [WB SNIFFER: HIT] ==================`);
        console.log(`[METHOD]: ${method}`);
        console.log(`[URL]: ${url}`);

        if (Array.isArray(data)) {
            console.log(`[ROOT]: Array (length: ${data.length})`);
        } else if (typeof data === "object" && data !== null) {
            console.log(`[ROOT KEYS]: ${JSON.stringify(Object.keys(data))}`);
        }

        // Поиск потенциальных рекламных / промо / спонсорских структур
        const adKeywords = ["ad", "advert", "promo", "banner", "sponsor", "booster", "recommend", "carousel", "popup", "teaser"];
        const matchedAdPaths = [];

        function scanForAds(obj, path, depth) {
            if (!obj || typeof obj !== "object" || depth > 6) return;

            if (Array.isArray(obj)) {
                // Если массив содержит объекты
                if (obj.length > 0 && typeof obj[0] === "object" && obj[0] !== null) {
                    const sample = obj[0];
                    const sampleKeys = Object.keys(sample);
                    
                    // Проверка наличия подозрительных ключей
                    const foundKey = sampleKeys.find(k => adKeywords.some(kw => k.toLowerCase().includes(kw)));
                    if (foundKey) {
                        matchedAdPaths.push(`${path}[] (Key hint: "${foundKey}", array len: ${obj.length})`);
                    }

                    // Проверка значений type, kind, name, id
                    if (sample.type || sample.kind || sample.id) {
                        const typeVal = String(sample.type || sample.kind || "");
                        if (adKeywords.some(kw => typeVal.toLowerCase().includes(kw))) {
                            matchedAdPaths.push(`${path}[] (Type hint: "${typeVal}", array len: ${obj.length})`);
                        }
                    }
                }

                // Рекурсивно проверяем первые элементы массива
                const checkCount = Math.min(obj.length, 3);
                for (let i = 0; i < checkCount; i++) {
                    scanForAds(obj[i], `${path}[${i}]`, depth + 1);
                }
            } else {
                for (const key in obj) {
                    if (adKeywords.some(kw => key.toLowerCase().includes(kw))) {
                        matchedAdPaths.push(`${path ? path + "." : ""}${key} (Type: ${typeof obj[key]})`);
                    }
                    if (obj[key] && typeof obj[key] === "object") {
                        scanForAds(obj[key], path ? `${path}.${key}` : key, depth + 1);
                    }
                }
            }
        }

        scanForAds(data, "", 0);

        if (matchedAdPaths.length > 0) {
            console.log(`\n🎯 [POSSIBLE AD TARGETS FOUND] (${matchedAdPaths.length}):`);
            const uniquePaths = Array.from(new Set(matchedAdPaths)).slice(0, 10);
            uniquePaths.forEach(p => console.log(`  -> ${p}`));
        }

        // Превью начала ответа
        const preview = typeof body === "string" ? body.slice(0, 300) : "";
        console.log(`\n[PREVIEW]: ${preview}...`);
        console.log(`=======================================================\n`);
    } catch (e) {
        // Ответ не JSON (бинарный/картинка/protobuf), логируем только эндпоинт если релевантен
        console.log(`[WB SNIFFER] Non-JSON or Stream: ${method} ${url}`);
    }
}

$done({});
