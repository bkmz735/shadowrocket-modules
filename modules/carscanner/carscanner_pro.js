// carscanner_pro.js - Сниффер и модификатор Car Scanner
(function () {
    const isRequest = typeof $response === 'undefined';
    const url = typeof $request !== 'undefined' ? $request.url : '';
    const method = typeof $request !== 'undefined' ? $request.method : 'UNKNOWN';

    // 1. Сниффер исходящего запроса
    if (isRequest) {
        const reqBody = typeof $request !== 'undefined' ? $request.body : '';
        console.log(`[CarScanner][REQ] >>> ${method} ${url}`);
        if (reqBody) {
            console.log(`[CarScanner][REQ_BODY] ${reqBody}`);
        }
        $done({});
        return;
    }

    // 2. Сниффер и модификатор входящего ответа
    let body = typeof $response !== 'undefined' ? $response.body : null;
    const status = typeof $response !== 'undefined' ? $response.status : 200;

    console.log(`[CarScanner][RES] <<< Status: ${status} for ${url}`);

    if (!body) {
        console.log(`[CarScanner][RES] Тело ответа пустое`);
        $done({});
        return;
    }

    console.log(`[CarScanner][RES_BODY_RAW] ${body}`);

    try {
        let json = JSON.parse(body);
        console.log(`[CarScanner][RES_JSON_PARSED]:\n${JSON.stringify(json, null, 2)}`);

        let modified = false;

        function walk(obj) {
            if (!obj || typeof obj !== 'object') return;

            for (let key in obj) {
                if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
                let val = obj[key];

                if (typeof val === 'string') {
                    if (/^(free|trial|inactive|expired|none|demo|disabled|false|0)$/i.test(val.trim())) {
                        obj[key] = 'active';
                        modified = true;
                    } else if (/status|tier|plan|type|level/i.test(key) && !/active|pro|premium/i.test(val)) {
                        obj[key] = 'active';
                        modified = true;
                    }
                } else if (typeof val === 'boolean') {
                    if (/pro|premium|ispro|ispromo|paid|valid|subscribed|active/i.test(key)) {
                        if (!val) {
                            obj[key] = true;
                            modified = true;
                        }
                    }
                } else if (typeof val === 'number') {
                    if (/expires?|expiry|timestamp|valid_until|end_date/i.test(key)) {
                        obj[key] = val > 1000000000000
                            ? Date.now() + 100 * 365 * 24 * 60 * 60 * 1000
                            : Math.floor((Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) / 1000);
                        modified = true;
                    }
                } else if (typeof val === 'object') {
                    walk(val);
                }
            }
        }

        walk(json);

        if (!modified) {
            json.status = 'active';
            json.plan = 'pro';
            json.isPro = true;
            json.pro = true;
            json.expires = '2099-12-31T23:59:59Z';
            json.expiry = 4102444799;
        }

        const modifiedBody = JSON.stringify(json);
        console.log(`[CarScanner][RES_MODIFIED]:\n${JSON.stringify(json, null, 2)}`);

        $done({ body: modifiedBody });
    } catch (e) {
        console.log(`[CarScanner][RES] Не является JSON (или зашифровано/строка): ${e.message}`);
        $done({});
    }
})();