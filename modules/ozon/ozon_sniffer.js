/**
 * 🕵️‍♂️ Ozon Deep Inspection & Reverse-Engineering Sniffer
 * Полный анализатор сетевого трафика и JSON-архитектуры Ozon (Composer, Layout, Tracking, Ad-Tech)
 */

const url = $request ? $request.url : "";
const method = $request ? $request.method : "GET";
const status = $response ? $response.status : 0;
const headers = $response ? ($response.headers || {}) : {};

function formatBytes(bytes) {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Извлечение чистого пути без query-параметров
let pathname = "";
try {
    pathname = url.split("?")[0].replace(/^https?:\/\/[^\/]+/, "");
} catch (e) {
    pathname = url;
}

if (typeof $response !== "undefined" && $response.body) {
    const rawBody = $response.body;
    const sizeStr = formatBytes(rawBody.length);

    console.log(`\n================== 🛰️ OZON DEEP SNIFFER ==================`);
    console.log(`📡 [HTTP] ${method} | Status: ${status} | Size: ${sizeStr}`);
    console.log(`🔗 [PATH] ${pathname}`);
    if (url.includes("?")) {
        console.log(`🔍 [QUERY] ?${url.split("?")[1]}`);
    }

    try {
        const data = JSON.parse(rawBody);
        const rootKeys = Object.keys(data);
        console.log(`📦 [ROOT KEYS]: ${JSON.stringify(rootKeys)}`);

        // 1. АНАЛИЗ OZON COMPOSER / CMS WIDGETS
        if (data.widgetStates && typeof data.widgetStates === "object") {
            const widgetKeys = Object.keys(data.widgetStates);
            console.log(`🧩 [WIDGET STATES TOTAL]: ${widgetKeys.length}`);

            // Группировка виджетов по базовому типу (до первого дефиса или подчеркивания)
            const typeSummary = {};
            const adSuspicious = [];
            const productHolders = [];

            for (const key of widgetKeys) {
                const baseName = key.split(/[-_]/)[0];
                typeSummary[baseName] = (typeSummary[baseName] || 0) + 1;

                const valStr = JSON.stringify(data.widgetStates[key]);
                const lowerKey = key.toLowerCase();
                const lowerVal = valStr.toLowerCase();

                // Поиск признаков рекламы, промо, баннеров и коммерческих меток
                const isAd = 
                    lowerKey.includes("banner") || 
                    lowerKey.includes("adv") || 
                    lowerKey.includes("promo") || 
                    lowerKey.includes("sponsor") || 
                    lowerKey.includes("highlight") ||
                    lowerKey.includes("brand") ||
                    lowerVal.includes("\"isadv\":true") ||
                    lowerVal.includes("\"advertisement\":true") ||
                    lowerVal.includes("\"commercial\":true") ||
                    lowerVal.includes("\"is_promo\":true");

                if (isAd) {
                    adSuspicious.push({
                        key: key,
                        len: valStr.length,
                        sample: valStr.length > 250 ? valStr.slice(0, 250) + "..." : valStr
                    });
                }

                // Поиск виджетов с товарами / поисковой выдачей
                if (
                    lowerKey.includes("search") || 
                    lowerKey.includes("catalog") || 
                    lowerKey.includes("item") || 
                    lowerKey.includes("tile") || 
                    lowerKey.includes("shelf")
                ) {
                    productHolders.push(key);
                }
            }

            // Вывод категорий виджетов
            const typesFormatted = Object.entries(typeSummary)
                .map(([t, count]) => `${t} (x${count})`)
                .join(", ");
            console.log(`📊 [WIDGET SPECTRUM]: ${typesFormatted}`);

            if (productHolders.length > 0) {
                console.log(`🛒 [PRODUCT/SEARCH WIDGETS]: ${productHolders.slice(0, 8).join(", ")}`);
            }

            // Вывод найденных рекламных структур
            if (adSuspicious.length > 0) {
                console.log(`🎯 [DETECTED AD/PROMO TARGETS (${adSuspicious.length})]:`);
                adSuspicious.forEach((item, idx) => {
                    console.log(`  #${idx + 1} [KEY]: ${item.key} (${item.len} bytes)`);
                    console.log(`     [SAMPLE]: ${item.sample}`);
                });
            }
        }

        // 2. АНАЛИЗ LAYOUT (Сетка расположения компонентов на экране)
        if (Array.isArray(data.layout)) {
            console.log(`📐 [LAYOUT TREE]: ${data.layout.length} root sections`);
            const layoutPreview = data.layout.slice(0, 8).map(item => {
                return item.component || item.name || item.type || JSON.stringify(item).slice(0, 40);
            });
            console.log(`📐 [LAYOUT SAMPLES]: ${layoutPreview.join(" ➔ ")}`);
        }

        // 3. АНАЛИЗ ТРЕКЕРОВ / МЕТРИК ВНУТРИ ОТВЕТА
        if (data.trackingPayloads || data.analytics || data.metrics) {
            console.log(`🏷️ [TRACKING/METRICS EMBEDDED]: Detected payload trackers in response`);
        }

        // 4. ЕСЛИ ЭТО КАРТОЧКА ТОВАРА (PDU / PDP)
        if (data.pdp || pathname.includes("/product") || pathname.includes("/pdp")) {
            console.log(`🛍️ [PRODUCT PAGE DETECTED]: Analyzing PDP layout blocks...`);
        }

    } catch (err) {
        // Ответ может быть gzip/brotli нераспакованным, либо бинарным/protobuf
        const isGzip = headers["Content-Encoding"] || headers["content-encoding"];
        console.log(`⚠️ [NON-JSON / BINARY]: Size ${sizeStr} | Content-Encoding: ${isGzip || "none"}`);
    }

    console.log(`==========================================================\n`);
}

$done({});