/**
 * 🕵️‍♂️ Wildberries ORD & ERID Ad Hunter (Memory-Safe)
 * 
 * Ищет и ловит ТОЛЬКО рекламу с маркировкой ОРД/ЕРИД:
 * - ordBannerMark (ООО/ИП, ИНН, ЕРИД)
 * - erid=
 * - advParams
 * 
 * Безопасен по памяти (лимит 1MB, фильтрация шума до парсинга).
 */

(function () {
    const url = (typeof $request !== "undefined" && $request.url) ? $request.url : "";
    const body = (typeof $response !== "undefined" && $response.body) ? $response.body : null;

    if (!body) {
        $done({});
        return;
    }

    // Игнорируем шум
    if (
        url.includes("journal-bt") ||
        url.includes("a.wb.ru") ||
        url.includes("sentry") ||
        url.includes("antibot") ||
        url.includes("locator") ||
        url.includes("sam-") ||
        url.includes("static-")
    ) {
        $done({});
        return;
    }

    try {
        const lower = body.toLowerCase();

        // Проверяем наличие юридических признаков рекламы ОРД
        if (
            lower.includes("erid") ||
            lower.includes("ordbannermark") ||
            lower.includes("инн ") ||
            lower.includes("ерид") ||
            lower.includes("advparams")
        ) {
            console.log("\n🎯🎯🎯 [ORD / ERID REKLAMA DETECTED!] 🎯🎯🎯");
            console.log("[URL]: " + url);

            const data = JSON.parse(body);

            // Рекурсивный поиск баннеров с ОРД
            function findOrd(obj, path) {
                if (!obj || typeof obj !== "object") return;

                if (Array.isArray(obj)) {
                    for (let i = 0; i < obj.length; i++) {
                        findOrd(obj[i], path + "[" + i + "]");
                    }
                } else {
                    // Проверяем сам объект на признаки рекламы
                    const mark = obj.ordBannerMark || obj.ord_mark || "";
                    const href = obj.href || obj.url || obj.link || "";
                    const adv = obj.advParams || "";
                    const type = obj.type || obj.kind || "";

                    const isAd = mark || href.includes("erid") || (typeof adv === "string" && adv.length > 5);

                    if (isAd) {
                        console.log("\n📌 НАЙДЕН РЕКЛАМНЫЙ БЛОК:");
                        console.log("  -> JSON-путь: " + path);
                        console.log("  -> Тип: " + type);
                        if (mark) console.log("  -> Маркировка ОРД: " + mark);
                        if (href) console.log("  -> Ссылка (href): " + href.slice(0, 120));
                        if (adv) console.log("  -> advParams: " + String(adv).slice(0, 100));
                    }

                    for (const k in obj) {
                        if (typeof obj[k] === "object") {
                            findOrd(obj[k], path ? path + "." + k : k);
                        }
                    }
                }
            }

            findOrd(data, "root");
            console.log("=====================================================\n");
        }
    } catch (e) {}

    $done({});
})();
