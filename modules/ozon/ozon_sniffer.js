/**
 * 🕵️‍♂️ Ozon Promo & Coupon Sniffer
 * Ищет и детально логирует промо-блоки, купоны, пуши («заберите сегодня», «купон» и т.д.)
 */

const url = $request ? $request.url : "";
const method = $request ? $request.method : "GET";

if (typeof $response !== "undefined" && $response.body) {
    try {
        const bodyStr = $response.body;

        // Ключевые слова промо-активностей, купонов, пропущенных бонусов, акций и маркировки рекламодателей
        const promoRegex = /купон|заберите|скидк|бонус|промо|акци|рубл|розыгрыш|джекпот|монет|приз|рекламодател|erid|общество\s+с\s+ограниченной/i;

        if (promoRegex.test(bodyStr)) {
            console.log(`\n================== [🎯 OZON PROMO SNIFFER MATCH] ==================`);
            console.log(`📡 URL: ${method} ${url}`);

            try {
                const data = JSON.parse(bodyStr);

                // Если это Composer Engine ответ
                if (data.widgetStates && typeof data.widgetStates === "object") {
                    console.log(`📦 --- Найдено в Composer widgetStates: ---`);
                    for (const key of Object.keys(data.widgetStates)) {
                        const valStr = JSON.stringify(data.widgetStates[key]);
                        if (promoRegex.test(key) || promoRegex.test(valStr)) {
                            console.log(`\n🔑 WIDGET KEY: [ ${key} ]`);
                            // Выводим фрагмент состояния виджета
                            console.log(`📄 STATE (превью 500 символов): ${valStr.slice(0, 500)}...`);
                        }
                    }
                }

                // Логирование позиций в layout
                if (Array.isArray(data.layout)) {
                    const layoutKeys = data.layout.map(i => i.widgetKey || i.name || i.component).filter(Boolean);
                    console.log(`\n📑 LAYOUT KEYS: ${JSON.stringify(layoutKeys)}`);
                }

                // Если структура другая (например, экшены или модалки)
                if (!data.widgetStates) {
                    console.log(`📄 PAYLOAD PREVIEW: ${bodyStr.slice(0, 800)}`);
                }

            } catch (jsonErr) {
                // Если не JSON или битый
                console.log(`📄 RAW SNIPPET: ${bodyStr.slice(0, 500)}`);
            }
            console.log(`===================================================================\n`);
        }
    } catch (e) {
        console.log(`❌ Sniffer error: ${e.message}`);
    }
}

$done({});