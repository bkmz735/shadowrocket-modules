/**
 * Universal iOS App Traffic Inspector & Ad Detector for Shadowrocket
 * GitHub: https://github.com/bkmz735/shadowrocket-modules
 * 
 * Optimized for stability: safe JSON parsing, payload size limit, non-blocking logs.
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

    // Игнорируем картинки, видео, стили и сервисы Apple
    const ignoreExtensions = /\.(png|jpg|jpeg|gif|webp|ico|svg|css|woff|woff2|ttf|otf|mp3|mp4|avi|mov|m3u8|ts)$/i;
    const ignoreDomains = /(apple\.com|icloud\.com|qq\.com|weixin\.qq\.com|cdn-apple\.com|mzstatic\.com)/i;

    if (ignoreExtensions.test(url) || ignoreDomains.test(url)) {
        $done({});
        return;
    }

    try {
        // Защита: проверяем, похоже ли тело ответа на JSON
        const trimmed = body.trim();
        if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
            const data = JSON.parse(trimmed);

            console.log(`\n================== 🔍 [SR TRAFFIC INSPECTOR] ==================`);
            console.log(`[METHOD] : ${method}`);
            console.log(`[URL]    : ${url.length > 150 ? url.substring(0, 150) + "..." : url}`);
            console.log(`[STATUS] : ${response.status}`);

            const rootKeys = Array.isArray(data) ? `Array[${data.length}]` : Object.keys(data);
            console.log(`[ROOT]   : ${JSON.stringify(rootKeys)}`);

            const adKeywords = ['ad', 'ads', 'banner', 'promo', 'promoted', 'sponsor', 'sponsored', 'commercial', 'advertisement', 'target', 'yandex', 'mytarget', 'vk_ads', 'feed_ad', 'native_ad'];
            const detectedAdPaths = [];

            function inspectNode(obj, currentPath = '', depth = 0) {
                if (!obj || typeof obj !== 'object' || depth > 6) return;

                if (Array.isArray(obj)) {
                    if (obj.length > 0) {
                        console.log(`  📌 Array at "${currentPath}" (Size: ${obj.length})`);
                        obj.slice(0, 4).forEach((item, index) => {
                            if (item && typeof item === 'object') {
                                const itemKeys = Object.keys(item);
                                const itemType = item.type || item.itemType || item.kind || item.component || item.layout || item.block_type || 'N/A';
                                console.log(`     [${index}] type="${itemType}" | keys=[${itemKeys.slice(0, 6).join(', ')}]`);

                                const itemStr = JSON.stringify(item).toLowerCase();
                                adKeywords.forEach(kw => {
                                    if (itemStr.includes(kw)) {
                                        detectedAdPaths.push(`${currentPath}[${index}] (Keyword: "${kw}")`);
                                    }
                                });
                            }
                        });
                    }
                } else {
                    for (const key in obj) {
                        if (Object.prototype.hasOwnProperty.call(obj, key)) {
                            const val = obj[key];
                            const nextPath = currentPath ? `${currentPath}.${key}` : key;

                            const lowerKey = key.toLowerCase();
                            if (adKeywords.some(kw => lowerKey.includes(kw))) {
                                console.log(`  🚨 AD KEY FOUND: "${nextPath}" = ${typeof val === 'object' ? 'OBJECT' : JSON.stringify(val)}`);
                            }

                            if (val && typeof val === 'object') {
                                inspectNode(val, nextPath, depth + 1);
                            }
                        }
                    }
                }
            }

            inspectNode(data);

            if (detectedAdPaths.length > 0) {
                console.log(`\n  ⚠️  OBVIOUS AD/SPAM BLOCKS DETECTED (${detectedAdPaths.length}):`);
                detectedAdPaths.slice(0, 8).forEach(path => console.log(`     • ${path}`));
            }

            console.log(`===============================================================\n`);
        }
    } catch (e) {
        // Ошибка парсинга или ответа не JSON - тихо прогоняем ответ
    }

    $done({});
})();
