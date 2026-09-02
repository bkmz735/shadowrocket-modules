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
    if (/storage-resolve|audio-ak-|audio-fa|\.scdn\.co\/audio\/|\.spotifycdn\.(com|net)\/audio|audio-attributes/i.test(targetUrl)) {
        return "🎵 AUDIO-RESOLVE";
    }
    if (/playplay\/v1\/key/i.test(targetUrl)) {
        return "🔐 DRM-KEY";
    }
    if (/bootstrap|user-customization|device-capabilities|pam-view|identity|melody|dealer|apresolve|login5|token|refresh|remote-config|accountsettings|premium-destination-hubs|pushka-tokens/i.test(targetUrl)) {
        return "🔑 AUTH/PROFILE";
    }
    if (/social-connect|connect-state|connect-group|speechless/i.test(targetUrl)) {
        return "🤝 CONNECT/JAM";
    }
    if (/capping-api/i.test(targetUrl)) {
        return "⚠️ CAPPING";
    }
    if (/ad-logic|ads|\/log\/|crashdump|event-service|telemetry|analytics|podcast-ap4p|partner-userid|gabo-receiver-service/i.test(targetUrl)) {
        return "📊 ADS";
    }
    if (/color-lyrics/i.test(targetUrl)) {
        return "🎤 LYRICS";
    }
    if (/herodotus/i.test(targetUrl)) {
        return "⏱ RESUME-POINT";
    }
    if (/net-fortune/i.test(targetUrl)) {
        return "📈 NET-SPEED";
    }
    if (/offline/i.test(targetUrl)) {
        return "💾 OFFLINE-CACHE";
    }
    if (/artistview|album-entity|playlist|search|track-view|decorate|casita|browsita|scrollsita|user-profile|inspiredby-mix|gander|contribution|partner-client-integrations|hub2/i.test(targetUrl)) {
        return "📑 META/UI";
    }
    if (/image|cover|avatar|mosaic|pickasso|daylist/i.test(targetUrl)) {
        return "🖼 IMG";
    }
    return "🌐 OTHER";
}

const tag = getCategory(url);
const now = new Date().toISOString().replace("T", " ").substr(11, 12);

if (!isResponse) {
    const headers = $request.headers || {};
    const rangeHeader = headers["Range"] || headers["range"] || null;
    const auth = (headers["Authorization"] || headers["authorization"]) ? "YES" : "NO";

    // Принудительно удаляем кэш-заголовки из запроса
    delete headers["If-None-Match"];
    delete headers["if-none-match"];
    delete headers["If-Modified-Since"];
    delete headers["if-modified-since"];

    console.log(`🔵 [REQ] [${now}] [${tag}] [${method}] Auth:${auth} Range:${rangeHeader || "none"} -> ${modifiedUrl}`);

    $done({
        url: modifiedUrl,
        headers: headers
    });
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
