/**
 * VK iOS Traffic Inspector & Ad Detector for Shadowrocket
 * GitHub: https://github.com/bkmz735/shadowrocket-modules
 */

(function () {
    const request = typeof $request !== "undefined" ? $request : null;
    const response = typeof $response !== "undefined" ? $response : null;

    if (!request || !response || !response.body) {
        $done({});
        return;
    }

    const url = request.url || "";
    const method = request.method || "GET";
    const body = response.body;

    try {
        const trimmed = body.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            const data = JSON.parse(trimmed);

            console.log(`\n================== 🔵 [VK API INSPECTOR] ==================`);
            console.log(`[URL]    : ${url}`);
            console.log(`[STATUS] : ${response.status}`);

            if (data.response) {
                const resp = data.response;
                if (resp.items && Array.isArray(resp.items)) {
                    console.log(`📌 Found "response.items" Array (Length: ${resp.items.length})`);
                    resp.items.slice(0, 5).forEach((item, idx) => {
                        const itemType = item.type || item.post_type || item.post_source?.type || 'POST/ITEM';
                        const isAd = item.ads || item.ad_data || item.type === 'ads' || item.type === 'promoted' || JSON.stringify(item).includes('promoted');
                        console.log(`   [${idx}] Type: "${itemType}" ${isAd ? '🚨 (AD/PROMO DETECTED)' : ''}`);
                    });
                } else {
                    console.log(`[RESP KEYS]: ${JSON.stringify(Object.keys(resp).slice(0, 10))}`);
                }
            } else if (data.error) {
                console.log(`❌ VK Error: ${JSON.stringify(data.error)}`);
            }

            console.log(`===========================================================\n`);
        }
    } catch (e) {}

    $done({});
})();
