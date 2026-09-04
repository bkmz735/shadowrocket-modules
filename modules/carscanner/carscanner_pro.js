// carscanner_pro.js - Модификатор и логгер ответа Car Scanner
(function () {
    const url = typeof $request !== 'undefined' ? $request.url : '';
    let body = typeof $response !== 'undefined' ? $response.body : null;

    if (!body) {
        console.log(`[CarScanner] Пустое тело ответа для URL: ${url}`);
        $done({});
        return;
    }

    console.log(`[CarScanner] Перехвачен URL: ${url}`);
    console.log(`[CarScanner] Исходный ответ (сырой):\n${body}`);

    try {
        let json = JSON.parse(body);
        console.log(`[CarScanner] Исходный JSON (распарсен):\n${JSON.stringify(json, null, 2)}`);

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
        console.log(`[CarScanner] Модифицированный JSON:\n${JSON.stringify(json, null, 2)}`);

        $done({ body: modifiedBody });
    } catch (e) {
        console.log(`[CarScanner] Ответ не является валидным JSON: ${e.message}`);
        $done({});
    }
})();