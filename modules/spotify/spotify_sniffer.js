/**
 * 🕵️‍♂️ Spotify Traffic Sniffer & URL Normalizer for Shadowrocket
 * 1. Срезает порт :443 для предотвращения ошибок 400 Bad Request на серверах spclient/gew1-spclient.
 * 2. Убирает перегрузку памяти (легковесное логирование заголовков и статусов без накопления буферов).
 */

const isResponse = typeof $response !== "undefined";
let url = $request ? $request.url : ($response ? $response.url : "");
const method = $request ? ($request.method || "GET") : "RES";

// Срез порта :443 для предотвращения 400 Bad Request
let modifiedUrl = url;
if (url.includes(".com:443")) {
    modifiedUrl = url.replace(/\.com:443/g, ".com");
}

function getCategory(targetUrl) {
    if (/audio-ak-|audio-fa|\.scdn\.co\/audio\/|\.spotifycdn\.(com|net)\/audio|storage-resolve|audio-attributes/i.test(targetUrl)) {
        return "🎵 AUDIO";
    }
    if (/bootstrap|user-customization|pam-view|identity|melody|dealer|apresolve|login5|token|refresh/i.test(targetUrl)) {
        return "🔑 AUTH";
    }
    if (/ad-logic|ads|\/log\/|crashdump|event-service|telemetry|analytics/i.test(targetUrl)) {
        return "📊 ADS";
    }
    if (/artistview|album-entity|playlist|search|track-view|decorate|casita|browsita/i.test(targetUrl)) {
        return "📑 META";
    }
    if (/image|cover|avatar|mosaic|pickasso/i.test(targetUrl)) {
        return "🖼 IMG";
    }
    return "🌐 OTHER";
}

const tag = getCategory(url);
const now = new Date().toISOString().replace("T", " ").substr(11, 12);

if (!isResponse) {
    const headers = $request.headers || {};
    const rangeHeader = headers["Range"] || headers["range"] || null;
    const ifNoneMatch = headers["If-None-Match"] || headers["if-none-match"] || null;
    const auth = (headers["Authorization"] || headers["authorization"]) ? "YES" : "NO";

    console.log(`🔵 [REQ] [${now}] [${tag}] [${method}] Auth:${auth} Range:${rangeHeader || "none"} IfNone:${ifNoneMatch || "none"} -> ${url}`);

    if (modifiedUrl !== url) {
        console.log(`✂️ Normalized URL (:443 removed) -> ${modifiedUrl}`);
        $done({ url: modifiedUrl });
    } else {
        $done({});
    }
} else {
    const status = $response.status || $response.statusCode || 200;
    const headers = $response.headers || {};
    const contentType = headers["Content-Type"] || headers["content-type"] || "-";
    const contentLength = headers["Content-Length"] || headers["content-length"] || "-";
    const icon = status >= 200 && status < 300 ? "🟢" : status === 304 ? "🟡" : "🔴";

    console.log(`${icon} [RES] [${now}] [${tag}] [STATUS: ${status}] len:${contentLength} type:${contentType} -> ${url}`);

    if (status >= 400 && $response.body) {
        const preview = typeof $response.body === "string" ? $response.body.slice(0, 150) : "[binary]";
        console.log(`⚠️ Error Body: ${preview}`);
    }

    $done({});
}
