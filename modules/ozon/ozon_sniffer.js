/**
 * 🕵️‍♂️ Ozon Chat & Messenger Sniffer
 * Логирует URL и тело запросов при открытии вкладки «Сообщения»
 */

const url = $request ? $request.url : "";
const method = $request ? $request.method : "GET";

if (typeof $response !== "undefined" && $response.body) {
    try {
        console.log(`\n💬 [OZON CHAT SNIFFER] >>> ${method} ${url}`);
        const sample = $response.body.slice(0, 400);
        console.log(`💬 [PAYLOAD PREVIEW]: ${sample}\n`);
    } catch (e) {}
}

$done({});