/**
 * 🕵️‍♂️ WB Exact Structure Dumper
 * Выводит точный JSON ответов /api/v5/main и /api/v1/profile,
 * чтобы увидеть ключи, управляющие показом/скрытием контейнера заглушки.
 */

(function () {
    const url = (typeof $request !== "undefined" && $request.url) ? $request.url : "";
    const body = (typeof $response !== "undefined" && $response.body) ? $response.body : null;

    if (body) {
        if (url.includes("banners-bt.wildberries.ru/api/v5/main")) {
            console.log("\n==================== [MAIN BANNERS ORIG JSON] ====================");
            console.log("[URL]: " + url);
            // Печатаем первые 3000 символов оригинального ответа главной
            console.log(body.slice(0, 3000));
            console.log("==================================================================\n");
        }

        if (url.includes("ui-bt.wildberries.ru/ui-bt/api/v1/profile")) {
            console.log("\n==================== [PROFILE ORIG JSON] ====================");
            console.log("[URL]: " + url);
            console.log(body.slice(0, 3000));
            console.log("=============================================================\n");
        }
    }

    $done({});
})();
