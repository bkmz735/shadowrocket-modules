/**
 * 🕵️‍♂️ Ozon Deep Inspector & Forensic Sniffer
 * Логирует структуру страниц Composer: URL, компоненты layout, ключи виджетов и тип контента
 */

const url = $request ? $request.url : "";
const method = $request ? $request.method : "GET";

if (typeof $response !== "undefined" && $response.body) {
    try {
        const bodyStr = $response.body;

        // Игнорируем фоновую телеметрию/метрики, чтобы не спамить в лог
        if (url.includes("/p-api/tracker/") || url.includes("/p-api/perf-metrics") || url.includes("/trackEvent")) {
            $done({});
        } else {
            console.log(`\n================== [🕵️‍♂️ OZON INSPECTOR] ==================`);
            console.log(`📡 ${method} ${url}`);

            try {
                const data = JSON.parse(bodyStr);

                // 1. Если это страница page/json или widget/json
                if (data.layout || data.widgetStates || data.state) {
                    // Список элементов в layout
                    if (Array.isArray(data.layout)) {
                        const layoutSummary = data.layout.map((item, idx) => {
                            const comp = item.component || "";
                            const stateId = item.stateId || item.widgetKey || "";
                            return `[${idx}] ${comp}${stateId ? " (" + stateId + ")" : ""}`;
                        });
                        console.log(`📑 LAYOUT (${data.layout.length} элементов):\n  ${layoutSummary.join("\n  ")}`);
                    }

                    // Анализ ключей и типов в widgetStates
                    if (data.widgetStates && typeof data.widgetStates === "object") {
                        const keys = Object.keys(data.widgetStates);
                        console.log(`📦 WIDGET_STATES (${keys.length} виджетов):`);
                        for (const k of keys) {
                            let val = data.widgetStates[k];
                            let preview = "";
                            if (typeof val === "string") {
                                try {
                                    const parsed = JSON.parse(val);
                                    const subkeys = Object.keys(parsed).join(", ");
                                    const count = (parsed.tiles && parsed.tiles.length) || 
                                                  (parsed.items && parsed.items.length) || 
                                                  (parsed.products && parsed.products.length) || "";
                                    preview = `[String-JSON: {${subkeys}}${count ? ", count=" + count : ""}]`;
                                } catch (e) {
                                    preview = `[Raw-String: ${val.slice(0, 100)}...]`;
                                }
                            } else if (val && typeof val === "object") {
                                const subkeys = Object.keys(val).join(", ");
                                const count = (val.tiles && val.tiles.length) || 
                                              (val.items && val.items.length) || 
                                              (val.products && val.products.length) || "";
                                preview = `[Object: {${subkeys}}${count ? ", count=" + count : ""}]`;
                            }
                            console.log(`  🔑 ${k} => ${preview}`);
                        }
                    }

                    // Если это ответ /widget/json/v2
                    if (data.state && typeof data.state === "object") {
                        const count = (data.state.tiles && data.state.tiles.length) || 
                                      (data.state.items && data.state.items.length) || 
                                      (data.state.products && data.state.products.length) || 0;
                        console.log(`📦 WIDGET SINGLE STATE: {${Object.keys(data.state).join(", ")}}, items count = ${count}`);
                    }

                } else {
                    // Другие ответы (экшены, конфиги)
                    console.log(`📄 PREVIEW: ${bodyStr.slice(0, 400)}...`);
                }

            } catch (jsonErr) {
                console.log(`📄 RAW BODY PREVIEW: ${bodyStr.slice(0, 300)}...`);
            }
            console.log(`=========================================================\n`);
        }
    } catch (e) {
        console.log(`❌ Sniffer error: ${e.message}`);
    }
}

$done({});