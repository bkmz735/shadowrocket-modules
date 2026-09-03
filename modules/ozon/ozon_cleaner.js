/**
 * 🛡️ Ozon AdBlock & Deep Cleaner
 * Вырезание рекламы, баннеров, чаевых и спам-диалогов в Сообщениях:
 * «Скидки и акции», «Морковск», «Только для вас», «Ozon Travel / Травел лента» и др.
 */

const url = $request ? $request.url : "";

// Список спам-каналов и рекламных ботов в Сообщениях
const SPAM_CHAT_KEYWORDS = [
    "скидки и акции",
    "морковск",
    "только для вас",
    "травел лента",
    "ozon travel",
    "ozon банк",
    "акции и скидки",
    "спецпредложения",
    "розыгрыш",
    "бонусы",
    "мои уведомления",
    "промо"
];

function isSpamChatText(text) {
    if (!text || typeof text !== "string") return false;
    const lower = text.toLowerCase();
    for (const kw of SPAM_CHAT_KEYWORDS) {
        if (lower.includes(kw)) {
            return true;
        }
    }
    return false;
}

// Префиксы рекламных виджетов Composer
const AD_WIDGET_PREFIXES = [
    "advbanner",
    "adbanner",
    "banner",
    "advvideobannermobile",
    "entrybannerwidget",
    "advrefreshwithdelay",
    "promobanner",
    "adcarousel",
    "rateitems" // «Поблагодарить продавца»
];

function isAdWidgetPrefix(key) {
    if (!key) return false;
    const lower = key.toLowerCase();
    for (const prefix of AD_WIDGET_PREFIXES) {
        if (lower.startsWith(prefix)) {
            return true;
        }
    }
    return false;
}

function shouldDeleteWidget(key, val) {
    const lowerKey = key.toLowerCase();

    // 1. Баланс Ozon Карты НЕ ТРОГАЕМ!
    if (lowerKey.startsWith("financewidget") || lowerKey.startsWith("financeheaderwidget")) {
        return false;
    }

    // 2. Прямой матчинг по префиксам
    if (isAdWidgetPrefix(key)) {
        return true;
    }

    const str = typeof val === "string" ? val : JSON.stringify(val);

    // 3. «Поблагодарить продавца» / Чаевые
    if (
        lowerKey.includes("rateitem") ||
        lowerKey.includes("tipping") ||
        str.includes("поблагодарить") ||
        str.includes("Поблагодарить") ||
        str.includes("чаевые") ||
        str.includes("Чаевые") ||
        str.includes("tips")
    ) {
        return true;
    }

    // 4. Баннер кредита в Ozon Банке (banklanding)
    if (
        lowerKey.includes("adbanner") ||
        str.includes("До 500 000") ||
        str.includes("чтобы продлить лето")
    ) {
        return true;
    }

    return false;
}

// Рекурсивная зачистка спам-чатов из любых массивов диалогов
function filterChatsDeep(obj) {
    if (!obj || typeof obj !== "object") return obj;

    // 1. Если это массив чатов / диалогов
    for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (Array.isArray(val)) {
            obj[key] = val.filter(item => {
                if (!item || typeof item !== "object") return true;
                const title = item.title || item.name || item.header || (item.chat && item.chat.title) || "";
                const subtitle = item.subtitle || item.lastMessageSnippet || item.snippet || "";
                if (isSpamChatText(title) || isSpamChatText(subtitle)) {
                    return false;
                }
                return true;
            });
            // Рекурсивно чистим дальше элементы массива
            for (let i = 0; i < obj[key].length; i++) {
                obj[key][i] = filterChatsDeep(obj[key][i]);
            }
        } else if (typeof val === "object") {
            obj[key] = filterChatsDeep(val);
        }
    }

    return obj;
}

function cleanOzonPayload(rawBody) {
    if (!rawBody) return rawBody;

    try {
        let data = JSON.parse(rawBody);
        let modified = false;

        // Если это сообщения, чаты или диалоги (любой эндпоинт мессенджера)
        if (
            url.includes("messenger") ||
            url.includes("chats") ||
            url.includes("communications") ||
            data.chats ||
            data.chatList
        ) {
            data = filterChatsDeep(data);
            return JSON.stringify(data);
        }

        const deletedWidgetKeys = new Set();

        // 1. Очистка widgetStates
        if (data.widgetStates && typeof data.widgetStates === "object") {
            for (const key of Object.keys(data.widgetStates)) {
                // Если внутри widgetStates сидит список чатов (экран мессенджера в Composer)
                if (key.toLowerCase().includes("chat") || key.toLowerCase().includes("messenger")) {
                    data.widgetStates[key] = filterChatsDeep(data.widgetStates[key]);
                    modified = true;
                    continue;
                }

                if (shouldDeleteWidget(key, data.widgetStates[key])) {
                    delete data.widgetStates[key];
                    deletedWidgetKeys.add(key);
                    modified = true;
                }
            }
        }

        // 2. Очистка дерева layout
        if (Array.isArray(data.layout)) {
            const initialLen = data.layout.length;
            
            data.layout = data.layout.filter(item => {
                const widgetKey = item.widgetKey || item.name || item.component || "";
                const lowerKey = widgetKey.toLowerCase();

                if (lowerKey.includes("financewidget") || lowerKey.includes("financeheaderwidget")) {
                    return true;
                }

                if (
                    lowerKey.includes("fintabbannerpriority") ||
                    lowerKey.includes("advbanner") ||
                    lowerKey.includes("advvideobannermobile") ||
                    lowerKey.includes("entrybannerwidget") ||
                    lowerKey.includes("rateitems") ||
                    deletedWidgetKeys.has(widgetKey) ||
                    isAdWidgetPrefix(widgetKey)
                ) {
                    return false;
                }
                return true;
            });

            // Очистка идущих подряд лишних разделителей
            const cleanedLayout = [];
            for (let i = 0; i < data.layout.length; i++) {
                const cur = data.layout[i];
                const curKey = (cur.widgetKey || cur.name || cur.component || "").toLowerCase();
                const isSep = curKey.includes("separator");

                if (isSep && cleanedLayout.length > 0) {
                    const prevKey = (cleanedLayout[cleanedLayout.length - 1].widgetKey || 
                                     cleanedLayout[cleanedLayout.length - 1].name || 
                                     cleanedLayout[cleanedLayout.length - 1].component || "").toLowerCase();
                    if (prevKey.includes("separator")) {
                        continue;
                    }
                }
                cleanedLayout.push(cur);
            }
            data.layout = cleanedLayout;

            if (data.layout.length !== initialLen) {
                modified = true;
            }
        }

        // 3. Зачистка встроенной аналитики
        if (data.trackingPayloads) {
            delete data.trackingPayloads;
            modified = true;
        }

        return modified ? JSON.stringify(data) : rawBody;

    } catch (e) {
        return rawBody;
    }
}

if (typeof $response !== "undefined" && $response.body) {
    const cleaned = cleanOzonPayload($response.body);
    $done({ body: cleaned });
} else {
    $done({});
}