/**
 * GetContact Ad SDK Initializer Blocker
 * GitHub: https://github.com/bkmz735/shadowrocket-modules
 */

(function () {
    const response = typeof $response !== "undefined" ? $response : null;

    if (!response || !response.body) {
        $done({});
        return;
    }

    try {
        let data = JSON.parse(response.body);
        let modified = false;

        // Патчим открытый эндпоинт конфигурации рекламных SDK
        if (data.result && data.result.adsSdkInit) {
            for (let key in data.result.adsSdkInit) {
                if (data.result.adsSdkInit[key] === true) {
                    data.result.adsSdkInit[key] = false;
                    modified = true;
                }
            }
        }

        if (modified) {
            console.log("[GetContact] 🛡️ Ad SDK Initialization prevented via JSON patch!");
            $done({ body: JSON.stringify(data) });
            return;
        }
    } catch (e) {
        console.log("[GetContact] ⚠️ Error parsing JSON: " + e);
    }

    $done({});
})();
