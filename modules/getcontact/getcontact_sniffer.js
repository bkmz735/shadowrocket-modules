/**
 * GetContact Local Sniffer Script
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
        if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
            let data = JSON.parse(trimmed);
            
            // Функция для извлечения структуры (ключи и типы)
            function getStructure(node, depth = 0) {
                if (depth > 5) return '...[MAX DEPTH]'; // Ограничение глубины
                
                if (node === null) return 'null';
                if (Array.isArray(node)) {
                    if (node.length === 0) return '[]';
                    return `Array[ ${getStructure(node[0], depth + 1)} ]`;
                }
                
                if (typeof node === 'object') {
                    let struct = '{ ';
                    let keys = Object.keys(node);
                    if (keys.length === 0) return '{}';
                    
                    for (let i = 0; i < keys.length; i++) {
                        let k = keys[i];
                        struct += `"${k}": ${getStructure(node[k], depth + 1)}`;
                        if (i < keys.length - 1) struct += ', ';
                    }
                    struct += ' }';
                    return struct;
                }
                
                return typeof node; // string, number, boolean
            }

            const structure = getStructure(data);
            console.log(`\n=============================\n[GetContact SNIFFER] 🔍 URL: ${url}\n📊 JSON Structure:\n${structure}\n=============================`);
        }
    } catch (e) {
        console.log(`[GetContact SNIFFER] Error parsing JSON: ${e}`);
    }

    $done({});
})();
