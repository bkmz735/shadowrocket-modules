/**
 * Universal iOS Ad & Spam Cleaner Script for Shadowrocket
 * GitHub: https://github.com/bkmz735/shadowrocket-modules
 */

const url = $request.url;
let body = $response.body;

if (!body) {
    $done({});
}

// Загрузка ключевых слов из аргументов модуля (разделитель |)
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
    } catch (e) {
        // Фолбэк на дефолтные ключевые слова
    }
}

try {
    let data = JSON.parse(body);
    let modified = false;
    let removedCount = 0;

    function isAdNode(node) {
        if (!node) return false;
        const str = JSON.stringify(node).toLowerCase();
        
        // Проверка типа узла или рекламных полей
        if (node.type && typeof node.type === 'string') {
            const t = node.type.toLowerCase();
            if (t.includes('ad') || t.includes('banner') || t.includes('promo') || t.includes('commercial')) {
                return true;
            }
        }
        
        // Проверка по ключевым словам во всем объекте
        for (let kw of keywords) {
            if (kw && str.includes(kw)) {
                return true;
            }
        }
        return false;
    }

    function cleanData(obj) {
        if (!obj || typeof obj !== 'object') return obj;

        if (Array.isArray(obj)) {
            const filtered = obj.filter(item => {
                if (isAdNode(item)) {
                    removedCount++;
                    modified = true;
                    return false;
                }
                return true;
            }).map(item => cleanData(item));
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
                        obj[key] = cleanData(obj[key]);
                    }
                }
            }
            return obj;
        }
    }

    data = cleanData(data);

    if (modified) {
        console.log(`[SR CLEANER] ✂️  Removed ${removedCount} ad/spam items from: ${url}`);
        $done({ body: JSON.stringify(data) });
    } else {
        $done({});
    }
} catch (e) {
    // Ответ не JSON, возвращаем без изменений
    $done({});
}
