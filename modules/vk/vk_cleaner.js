/**
 * VK iOS Ad & Spam Cleaner Script for Shadowrocket
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
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            let data = JSON.parse(trimmed);
            let modified = false;
            let removedCount = 0;

            if (data && data.response) {
                let items = data.response.items;
                if (Array.isArray(items)) {
                    const originalCount = items.length;
                    data.response.items = items.filter(item => {
                        if (!item) return false;

                        // 1. Прямые рекламные метки VK
                        if (item.type === 'ads' || item.type === 'promoted' || item.type === 'app' || item.type === 'authors_rec' || item.type === 'recommended') {
                            removedCount++;
                            return false;
                        }

                        // 2. Наличие полей рекламы / баннеров
                        if (item.ads || item.ad_data || item.promoted_post || item.ads_title) {
                            removedCount++;
                            return false;
                        }

                        // 3. Рекламный источник или клип
                        if (item.post_source && item.post_source.type === 'ad') {
                            removedCount++;
                            return false;
                        }

                        return true;
                    });

                    if (items.length !== data.response.items.length) {
                        modified = true;
                    }
                }
            }

            if (modified) {
                console.log(`[VK CLEANER] ✂️ Removed ${removedCount} ads/promos from VK feed: ${url}`);
                $done({ body: JSON.stringify(data) });
                return;
            }
        }
    } catch (e) {}

    $done({});
})();
