/**
 * Universal iOS Ad & Spam Cleaner Script for Shadowrocket
 * GitHub: https://github.com/bkmz735/shadowrocket-modules
 * 
 * Optimized for memory and stability.
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

    let keywords = ["реклама", "промо", "banner", "sponsored", "mytarget", "yandex", "ad", "ads", "promoted"];
    if (typeof $argument !== "undefined" && $argument) {
        try {
            let rawArgs = $argument;
            if (typeof rawArgs === "string" && rawArgs.includes("keywords=")) {
                rawArgs = rawArgs.split("keywords=")[1].split("&")[0];
            }
            if (rawArgs && !rawArgs.includes("{{{")) {
                keywords = rawArgs.split("|").map(k => k.trim().toLowerCase()).filter(Boolean);
            }
        } catch (e) {}
    }

    try {
        const trimmed = body.trim();
        if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
            let data = JSON.parse(trimmed);
            let modified = false;
            let removedCount = 0;

            function isAdNode(node) {
                if (!node) return false;
                const str = JSON.stringify(node).toLowerCase();

                if (node.type && typeof node.type === 'string') {
                    const t = node.type.toLowerCase();
                    if (t.includes('ad') || t.includes('banner') || t.includes('promo') || t.includes('commercial')) {
                        return true;
                    }
                }

                for (let kw of keywords) {
                    if (kw && str.includes(kw)) {
                        return true;
                    }
                }
                return false;
            }

            function cleanData(obj, depth = 0) {
                if (!obj || typeof obj !== 'object' || depth > 8) return obj;

                if (Array.isArray(obj)) {
                    const filtered = obj.filter(item => {
                        if (isAdNode(item)) {
                            removedCount++;
                            modified = true;
                            return false;
                        }
                        return true;
                    }).map(item => cleanData(item, depth + 1));
                    return filtered;
                } else {
                    for (let key in obj) {
                        if (Object.prototype.hasOwnProperty.call(obj, key)) {
                            const lowerKey = key.toLowerCase();
                            if (keywords.some(kw => lowerKey.includes(kw))) {
                                delete obj[key];
                                removedCount++;
                                modified = true;
                            } else {
                                obj[key] = cleanData(obj[key], depth + 1);
                            }
                        }
                    }
                    return obj;
                }
            }

            data = cleanData(data);

            if (modified) {
                console.log(`[SR CLEANER] ✂️  Removed ${removedCount} ad/spam items from: ${url.length > 120 ? url.substring(0, 120) + "..." : url}`);
                $done({ body: JSON.stringify(data) });
                return;
            }
        }
    } catch (e) {}

    $done({});
})();
