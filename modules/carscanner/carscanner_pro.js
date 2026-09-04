// carscanner.js – универсальный подменщик для Car Scanner
let body = $response.body;
if (!body) { $done({}); return; }

try {
    let json = JSON.parse(body);
    let modified = false;

    // Рекурсивно обходим все ключи и значения
    function walk(obj) {
        for (let key in obj) {
            if (!obj.hasOwnProperty(key)) continue;
            let val = obj[key];
            // Если значение – строка, ищем признаки "free/trial/inactive/expired"
            if (typeof val === 'string') {
                if (/free|trial|inactive|expired|none|demo/i.test(val)) {
                    obj[key] = 'active';
                    modified = true;
                }
                // Также проверяем ключи, содержащие "pro", "premium", "status"
                if (/pro|premium|status|tier|plan/i.test(key)) {
                    if (/free|trial|inactive|expired|none|demo/i.test(val)) {
                        obj[key] = 'active';
                        modified = true;
                    }
                }
            }
            // Если значение – булево, и ключ похож на "pro" или "premium" – ставим true
            if (typeof val === 'boolean') {
                if (/pro|premium|ispro|ispromo|paid/i.test(key)) {
                    if (!val) {
                        obj[key] = true;
                        modified = true;
                    }
                }
            }
            // Если значение – число, и ключ похож на "expires" или "expiry" – ставим далеко в будущее
            if (typeof val === 'number') {
                if (/expires?|expiry|timestamp/i.test(key)) {
                    obj[key] = Date.now() + 100 * 365 * 24 * 60 * 60 * 1000;
                    modified = true;
                }
            }
            // Если значение – объект или массив, рекурсивно обходим
            if (typeof val === 'object' && val !== null) {
                walk(val);
            }
        }
    }

    walk(json);

    // Если ничего не нашли – добавляем стандартные поля
    if (!modified) {
        json.status = 'active';
        json.plan = 'pro';
        json.isPro = true;
        json.expires = '2099-12-31T23:59:59Z';
        modified = true;
    }

    $done({
        status: 200,
        headers: $response.headers,
        body: JSON.stringify(json)
    });
} catch (e) {
    // Если не JSON – пропускаем
    $done({});
}