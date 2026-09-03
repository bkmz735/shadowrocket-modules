/**
 * 🫐 Wildberries Deep Sniffer & Inspector
 * Показывает точный текст, заголовки баннеров, названия акций и структуру карточек
 */

const url = $request ? $request.url : "";
const method = $request ? $request.method : "GET";
const body = (typeof $response !== "undefined" && $response.body) ? $response.body : null;

// Игнорируем служебные технические запросы, чтобы не спамить в лог
const IGNORED_URLS = [
    "antibot.wildberries.ru",
    "locator.wildberries.ru",
    "delivery-points-storage",
    "courses/rub.json"
];

if (body && !IGNORED_URLS.some(ign => url.includes(ign))) {
    try {
        const data = JSON.parse(body);

        console.log(`\n================== [WB DEEP INSPECTOR] ==================`);
        console.log(`[METHOD]: ${method}`);
        console.log(`[URL]: ${url}`);

        // Рекурсивный поиск текстовых полей, баннеров, акций и каруселей
        const extractedFindings = [];

        function deepInspect(obj, path, depth) {
            if (!obj || typeof obj !== "object" || depth > 7) return;

            if (Array.isArray(obj)) {
                // Если массив элементов
                if (obj.length > 0 && typeof obj[0] === "object" && obj[0] !== null) {
                    // Проверяем элементы на наличие названий, баннеров, акций
                    obj.forEach((item, idx) => {
                        if (!item || typeof item !== "object") return;

                        const type = item.type || item.kind || item.blockType || item.componentType || "";
                        const title = item.title || item.name || item.header || item.text || item.caption || "";
                        const subTitle = item.subTitle || item.subtitle || item.description || "";
                        const promoText = item.promoText || item.badge || item.label || "";
                        const actionUrl = item.actionUrl || item.link || item.url || item.targetUrl || "";

                        // Если это баннер, карусель, промо-блок или товар
                        if (type || title || promoText || actionUrl) {
                            extractedFindings.push({
                                path: `${path}[${idx}]`,
                                type: String(type),
                                title: String(title).slice(0, 100),
                                subTitle: String(subTitle).slice(0, 100),
                                badge: String(promoText).slice(0, 50),
                                link: String(actionUrl).slice(0, 120),
                                keys: Object.keys(item).slice(0, 8).join(", ")
                            });
                        }
                    });
                }

                // Рекурсия внутрь первых 5 элементов
                const inspectLimit = Math.min(obj.length, 5);
                for (let i = 0; i < inspectLimit; i++) {
                    deepInspect(obj[i], `${path}[${i}]`, depth + 1);
                }
            } else {
                // Если объект содержит баннеры или промо-поля
                for (const k in obj) {
                    const lk = k.toLowerCase();
                    if (
                        lk.includes("banner") ||
                        lk.includes("promo") ||
                        lk.includes("carousel") ||
                        lk.includes("advert") ||
                        lk.includes("popup") ||
                        lk.includes("teaser") ||
                        lk.includes("story") ||
                        lk.includes("stories")
                    ) {
                        const val = obj[k];
                        if (typeof val === "string" && val.length < 200) {
                            extractedFindings.push({
                                path: `${path ? path + "." : ""}${k}`,
                                type: "STRING_PROP",
                                title: val,
                                subTitle: "",
                                badge: "",
                                link: "",
                                keys: ""
                            });
                        } else if (Array.isArray(val)) {
                            extractedFindings.push({
                                path: `${path ? path + "." : ""}${k}`,
                                type: `ARRAY (length: ${val.length})`,
                                title: "",
                                subTitle: "",
                                badge: "",
                                link: "",
                                keys: val.length > 0 && typeof val[0] === "object" ? Object.keys(val[0]).join(", ") : ""
                            });
                        }
                    }

                    if (obj[k] && typeof obj[k] === "object") {
                        deepInspect(obj[k], path ? `${path}.${k}` : k, depth + 1);
                    }
                }
            }
        }

        deepInspect(data, "", 0);

        if (extractedFindings.length > 0) {
            console.log(`\n📢 [НАЙДЕНЫ БЛОКИ / ТЕКСТЫ РЕКЛАМЫ И БАННЕРОВ] (Всего: ${extractedFindings.length}):`);
            const preview = extractedFindings.slice(0, 25);
            preview.forEach(f => {
                console.log(`  🔹 [${f.path}] Type: "${f.type}"`);
                if (f.title) console.log(`     Текст/Заголовок: "${f.title}"`);
                if (f.subTitle) console.log(`     Подзаголовок: "${f.subTitle}"`);
                if (f.badge) console.log(`     Бейдж/Промо: "${f.badge}"`);
                if (f.link) console.log(`     Ссылка/Действие: "${f.link}"`);
                if (f.keys) console.log(`     Ключи объекта: [${f.keys}]`);
            });
            if (extractedFindings.length > 25) {
                console.log(`     ... и еще ${extractedFindings.length - 25} элементов`);
            }
        } else {
            console.log(`[INFO] Явных промо-блоков не найдено, ключи корня: ${JSON.stringify(Object.keys(data))}`);
        }

        console.log(`=========================================================\n`);
    } catch (e) {
        // не json
    }
}

$done({});
