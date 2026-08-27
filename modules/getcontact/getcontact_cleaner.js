/**
 * GetContact iOS/Android Ad & Popup Cleaner Script
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
    let body = response.body;

    try {
        const trimmed = body.trim();
        if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
            let data = JSON.parse(trimmed);
            let modified = false;

            // Ключи, которые мы хотим полностью удалять (спам, поп-апы, реклама, баннеры)
            const removeKeys = [
                'ads', 'ad_options', 'banners', 'banner', 'popups', 'popup', 
                'promos', 'promo', 'offers', 'offer', 'interstitials', 
                'interstitial', 'video_ads', 'rate_app', 'force_update',
                'premium_promo', 'premium_offer', 'premium_popup', 
                'subscription_promo', 'rewarded_video'
            ];

            function cleanNode(node, depth = 0) {
                if (!node || typeof node !== 'object' || depth > 10) return node;

                if (Array.isArray(node)) {
                    return node.filter(item => {
                        if (item && typeof item === 'object') {
                            const type = (item.type || item.item_type || item.action || '').toString().toLowerCase();
                            // Удаляем элементы массивов, если это баннер или промо
                            if (type.includes('ad') || type.includes('banner') || type.includes('promo') || type.includes('popup') || type.includes('offer')) {
                                modified = true;
                                return false;
                            }
                        }
                        return true;
                    }).map(item => cleanNode(item, depth + 1));
                } else {
                    for (let key in node) {
                        if (Object.prototype.hasOwnProperty.call(node, key)) {
                            const lowerKey = key.toLowerCase();
                            
                            // 1. Вырезаем мусорные рекламные объекты
                            if (removeKeys.some(rk => lowerKey === rk || lowerKey.includes(rk))) {
                                delete node[key];
                                modified = true;
                            } 
                            // 2. Блокируем показ рекламы через флаги конфигурации (config/settings)
                            else if (lowerKey === 'show_ads' || lowerKey === 'is_ad_enabled') {
                                if (node[key] !== false) {
                                    node[key] = false;
                                    modified = true;
                                }
                            }
                            else if (lowerKey === 'is_premium') {
                                // Бонус: иногда это отключает назойливые премиум-попапы (визуальный премиум)
                                if (node[key] !== true) {
                                    node[key] = true;
                                    modified = true;
                                }
                            }
                            else {
                                node[key] = cleanNode(node[key], depth + 1);
                            }
                        }
                    }
                    return node;
                }
            }

            data = cleanNode(data);

            if (modified) {
                console.log(`[GetContact CLEANER] ✂️ Removed ads/popups from: ${url}`);
                $done({ body: JSON.stringify(data) });
                return;
            }
        }
    } catch (e) {}

    $done({});
})();
