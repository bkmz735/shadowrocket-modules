/**
 * 🕵️‍♂️ Ultimate Spotify Traffic Sniffer for Shadowrocket
 * Перехватывает запросы и ответы Spotify, классифицирует трафик, логирует заголовки, статусы, Range чанков и структуру данных.
 */

const url = $request ? $request.url : ($response ? $response.url : "");
const method = $request ? ($request.method || "GET") : "RES";
const isResponse = typeof $response !== "undefined";

function getCategory(targetUrl) {
    if (/audio-ak-|audio-fa|\.scdn\.co\/audio\/|\.spotifycdn\.(com|net)\/audio|storage-resolve|audio-attributes/i.test(targetUrl)) {
        return { tag: "🎵 AUDIO_STREAM", isAudio: true };
    }
    if (/bootstrap|user-customization|melody|dealer|apresolve|login5|token|refresh/i.test(targetUrl)) {
        return { tag: "🔑 AUTH_SESSION", isAudio: false };
    }
    if (/ad-logic|ads|\/log\/|crashdump|event-service|telemetry|analytics/i.test(targetUrl)) {
        return { tag: "📊 ADS_TELEMETRY", isAudio: false };
    }
    if (/artistview|album-entity|playlist|search|track-view|decorate/i.test(targetUrl)) {
        return { tag: "📑 METADATA_CATALOG", isAudio: false };
    }
    if (/image|cover|avatar|mosaic/i.test(targetUrl)) {
        return { tag: "🖼 IMAGES", isAudio: false };
    }
    return { tag: "🌐 OTHER", isAudio: false };
}

const { tag, isAudio } = getCategory(url);
const now = new Date().toISOString().replace("T", " ").substr(11, 12);

if (!isResponse) {
    // === ЛОГИРОВАНИЕ ЗАПРОСА (REQUEST) ===
    const headers = $request.headers || {};
    const rangeHeader = headers["Range"] || headers["range"] || null;
    const authHeader = headers["Authorization"] || headers["authorization"] ? "[PRESENT]" : "[NONE]";
    const ifNoneMatch = headers["If-None-Match"] || headers["if-none-match"] || null;
    
    console.log(`\n🔵 >>> [REQ] [${now}] [${tag}] [${method}]`);
    console.log(`🔗 URL: ${url}`);
    if (rangeHeader) console.log(`⏩ Range (Audio Chunk): ${rangeHeader}`);
    if (ifNoneMatch) console.log(`🔄 If-None-Match: ${ifNoneMatch}`);
    console.log(`🛡 Auth: ${authHeader} | User-Agent: ${headers["User-Agent"] || headers["user-agent"] || "N/A"}`);
    
    if ($request.body) {
        if (typeof $request.body === "string") {
            try {
                const parsed = JSON.parse($request.body);
                console.log(`📦 Body (JSON): ${JSON.stringify(parsed).slice(0, 500)}`);
            } catch (e) {
                console.log(`📦 Body (Raw text, ${$request.body.length} chars): ${$request.body.slice(0, 300)}`);
            }
        } else {
            console.log(`📦 Body (Binary/Protobuf): size=${$request.body.length || $request.body.byteLength || 0} bytes`);
        }
    }
    $done({});
} else {
    // === ЛОГИРОВАНИЕ ОТВЕТА (RESPONSE) ===
    const status = $response.status || $response.statusCode || 200;
    const headers = $response.headers || {};
    const contentType = headers["Content-Type"] || headers["content-type"] || "unknown";
    const contentRange = headers["Content-Range"] || headers["content-range"] || null;
    const contentLength = headers["Content-Length"] || headers["content-length"] || null;
    const statusIcon = status >= 200 && status < 300 ? "🟢" : status >= 300 && status < 400 ? "🟡" : "🔴";

    console.log(`\n${statusIcon} <<< [RES] [${now}] [${tag}] [STATUS: ${status}]`);
    console.log(`🔗 URL: ${url}`);
    console.log(`📋 Content-Type: ${contentType} | Content-Length: ${contentLength || "chunked"}`);
    if (contentRange) console.log(`🎯 Content-Range: ${contentRange}`);

    if ($response.body) {
        if (isAudio || /audio|octet-stream/i.test(contentType)) {
            const size = typeof $response.body === "string" ? $response.body.length : ($response.body.length || $response.body.byteLength || "N/A");
            console.log(`🎵 Audio Payload: ${size} bytes delivered`);
        } else if (typeof $response.body === "string") {
            try {
                const parsed = JSON.parse($response.body);
                console.log(`📄 Response (JSON): ${JSON.stringify(parsed, null, 2).slice(0, 1000)}`);
            } catch (e) {
                console.log(`📄 Response (Text): ${$response.body.slice(0, 500)}`);
            }
        } else {
            const size = $response.body.length || $response.body.byteLength || 0;
            console.log(`📄 Response (Binary/Protobuf): size=${size} bytes`);
        }
    }
    $done({});
}
