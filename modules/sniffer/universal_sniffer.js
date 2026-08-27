/**
 * Universal iOS App Traffic Inspector & Ad Detector for Shadowrocket
 * GitHub: https://github.com/bkmz735/shadowrocket-modules
 */

const url = $request.url;
const method = $request.method || 'GET';
const response = $response;
const body = response ? response.body : null;

// Игнорируем статичные ресурсы и служебные сервисы Apple
const ignoreExtensions = /\.(png|jpg|jpeg|gif|webp|ico|svg|css|woff|woff2|ttf|otf|mp3|mp4|avi|mov)$/i;
const ignoreDomains = /(apple\.com|icloud\.com|qq\.com|weixin\.qq\.com|cdn-apple\.com)/i;

if (body && !ignoreExtensions.test(url) && !ignoreDomains.test(url)) {
    try {
        const data = JSON.parse(body);
        
        console.log(`\n================== 🔍 [SR TRAFFIC INSPECTOR] ==================`);
        console.log(`[METHOD] : ${method}`);
        console.log(`[URL]    : ${url}`);
        console.log(`[STATUS] : ${response.status}`);
        
        const rootKeys = Array.isArray(data) ? `Array[${data.length}]` : Object.keys(data);
        console.log(`[ROOT]   : ${JSON.stringify(rootKeys)}`);

        // Ключевые слова потенциальной рекламы для быстрого поиска
        const adKeywords = ['ad', 'ads', 'banner', 'promo', 'promoted', 'sponsor', 'sponsored', 'commercial', 'advertisement', 'target', 'yandex', 'mytarget', 'vk_ads', 'feed_ad', 'native_ad'];
        const detectedAdPaths = [];

        function inspectNode(obj, currentPath = '') {
            if (!obj || typeof obj !== 'object') return;

            if (Array.isArray(obj)) {
                if (obj.length > 0) {
                    console.log(`  📌 Array at "${currentPath}" (Size: ${obj.length})`);
                    obj.slice(0, 5).forEach((item, index) => {
                        if (item && typeof item === 'object') {
                            const itemKeys = Object.keys(item);
                            const itemType = item.type || item.itemType || item.kind || item.component || item.layout || item.block_type || 'N/A';
                            console.log(`     [${index}] type="${itemType}" | keys=[${itemKeys.slice(0, 8).join(', ')}]`);
                            
                            // Проверка элементов массива на наличие рекламных меток
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
                            inspectNode(val, nextPath);
                        }
                    }
                }
            }
        }

        inspectNode(data);

        if (detectedAdPaths.length > 0) {
            console.log(`\n  ⚠️  OBVIOUS AD/SPAM BLOCKS DETECTED (${detectedAdPaths.length}):`);
            detectedAdPaths.slice(0, 10).forEach(path => console.log(`     • ${path}`));
        }

        console.log(`===============================================================\n`);
    } catch (e) {
        // Ответ не в формате JSON
    }
}

$done({});
