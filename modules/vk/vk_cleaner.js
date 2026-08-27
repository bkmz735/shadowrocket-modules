/**
 * VK iOS Ad, Banner, Promo-Widget & Spam Cleaner Script for Shadowrocket
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
            let removedCount = 0;

            function isAdItem(item) {
                if (!item || typeof item !== 'object') return false;

                const itemType = (item.type || item.post_type || item.block_type || item.template || item.layout || '').toString().toLowerCase();

                // 1. Проверка типов на promo_widget, banner, ad, commercial
                if (itemType.includes('promo') || itemType.includes('ad') || itemType.includes('banner') || itemType.includes('commercial')) {
                    return true;
                }
                if (['app', 'authors_rec', 'recommended', 'recommended_groups', 'suggested'].includes(itemType)) {
                    return true;
                }

                // 2. Наличие полей промо-виджетов и рекламных полей
                if (item.ads || item.ad_data || item.promoted_post || item.ads_title || item.ad_marker || item.ad_block || item.promo_widget || item.promoWidget || item.widget_promo || item.promo_block || item.promo_banner) {
                    return true;
                }

                // 3. Рекламный источник поста
                if (item.post_source && (item.post_source.type === 'ad' || item.post_source.type === 'promoted' || item.post_source.type === 'promo')) {
                    return true;
                }

                // 4. Маркеры маркированной рекламы и промо-виджетов в строке
                const str = JSON.stringify(item).toLowerCase();
                if (str.includes('"is_ad":true') || str.includes('"is_promoted":true') || str.includes('"ad_data"') || str.includes('marked_as_ads":1') || str.includes('promo_widget') || str.includes('promowidget')) {
                    return true;
                }

                return false;
            }

            function cleanNode(node, depth = 0) {
                if (!node || typeof node !== 'object' || depth > 10) return node;

                if (Array.isArray(node)) {
                    const filtered = node.filter(item => {
                        if (isAdItem(item)) {
                            removedCount++;
                            modified = true;
                            return false;
                        }
                        return true;
                    }).map(item => cleanNode(item, depth + 1));
                    return filtered;
                } else {
                    for (let key in node) {
                        if (Object.prototype.hasOwnProperty.call(node, key)) {
                            const lowerKey = key.toLowerCase();
                            if (['ads', 'promoted_post', 'ad_data', 'banner', 'banners', 'widget_ads', 'promo_widget', 'promowidget', 'widget_promo', 'promo_block', 'promo_banner'].includes(lowerKey) || lowerKey.includes('promo_widget')) {
                                delete node[key];
                                removedCount++;
                                modified = true;
                            } else {
                                node[key] = cleanNode(node[key], depth + 1);
                            }
                        }
                    }
                    return node;
                }
            }

            data = cleanNode(data);

            if (modified) {
                console.log(`[VK CLEANER] ✂️ Removed ${removedCount} ad/banner/promo-widget items from VK response: ${url}`);
                $done({ body: JSON.stringify(data) });
                return;
            }
        }
    } catch (e) {}

    $done({});
})();
