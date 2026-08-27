/**
 * VK iOS Traffic Inspector & Full Ad Sniffer for Shadowrocket
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

            console.log(`\n================== 🔍 [VK TRAFFIC SNIFFER] ==================`);
            console.log(`[URL]    : ${url}`);
            console.log(`[STATUS] : ${response.status}`);

            if (data.response) {
                const resp = data.response;

                function findArraysAndInspect(obj, path = '') {
                    if (!obj || typeof obj !== 'object') return;

                    if (Array.isArray(obj)) {
                        console.log(`  📌 Array at "${path}" (Length: ${obj.length})`);
                        obj.forEach((item, idx) => {
                            if (item && typeof item === 'object') {
                                const itemStr = JSON.stringify(item).toLowerCase();
                                const type = item.type || item.post_type || item.block_type || 'N/A';
                                const isAd = itemStr.includes('ad') || itemStr.includes('promo') || itemStr.includes('banner') || itemStr.includes('marked_as_ads');
                                
                                console.log(`     [${idx}] Type: "${type}" | Marked: ${isAd ? '🚨 AD/PROMO' : 'OK'}`);
                                if (isAd) {
                                    console.log(`        👉 Sample Keys: [${Object.keys(item).slice(0, 10).join(', ')}]`);
                                    console.log(`        👉 Snippet: ${JSON.stringify(item).substring(0, 250)}...`);
                                }
                            }
                        });
                    } else {
                        for (let k in obj) {
                            if (Object.prototype.hasOwnProperty.call(obj, k) && typeof obj[k] === 'object') {
                                findArraysAndInspect(obj[k], path ? `${path}.${k}` : k);
                            }
                        }
                    }
                }

                findArraysAndInspect(resp);
            } else if (data.error) {
                console.log(`❌ VK API Error: ${JSON.stringify(data.error)}`);
            }

            console.log(`=============================================================\n`);
        }
    } catch (e) {}

    $done({});
})();
