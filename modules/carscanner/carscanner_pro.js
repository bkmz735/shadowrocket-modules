// carscanner_pro.js - Модификатор и логгер ответа Car Scanner
// Логирует входящий ответ и модифицирует структуру для активации Pro

const url = typeof $request !== 'undefined' ? $request.url : '';
let body = $response.body;

if (!body) {
    console.log(`[CarScanner] Пустое тело ответа для URL: ${url}`);
    $done({});
} else {
    console.log(`[CarScanner] Запрос: ${url}`);
    console.log(`[CarScanner] Исходный ответ (сырой):\n${body}`);

    try {
        let json = JSON.parse(body);
        console.log(`[CarScanner] Исходный JSON (распарсен):\n${JSON.stringify(json, null, 2)}`);

        let modified = false;

        // Рекурсивный обход и замена полей
        function walk(obj) {
            if (!obj || typeof obj !== 'object') return;

            for (let key in obj) {
                if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
                let val = obj[key];

                // Строковые статусы
                if (typeof val === 'string') {
                    if (/^(free|trial|inactive|expired|none|demo|disabled|false|0)$/i.test(val.trim())) {
                        obj[key] = 'active';
                        modified = true;
                    } else if (/status|tier|plan|type|level/i.test(key) && !/active|pro|premium/i.test(val)) {
                        obj[key] = 'active';
                        modified = true;
                    }
                }
                // Булевы флаги Pro/Premium
                else if (typeof val === 'boolean') {
                    if (/pro|premium|ispro|ispromo|paid|valid|subscribed|active/i.test(key)) {
                        if (!val) {
                            obj[key] = true;
                            modified = true;
                        }
                    }
                }
                // Временные метки (продлеваем на 100 лет)
                else if (typeof val === 'number') {
                    if (/expires?|expiry|timestamp|valid_until|end_date/i.test(key)) {
                        // Если в секундах или миллисекундах
                        obj[key] = val > 1000000000000
                            ? Date.now() + 100 * 365 * 24 * 60 * 60 * 1000
                            : Math.floor((Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) / 1000);
                        modified = true;
                    }
                }
                // Рекурсивный спуск
                else if (typeof val === 'object') {
                    walk(val);
                }
            }
        }

        walk(json);

        // Если не нашли подходящих полей - подставляем базовую структуру
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

        // Возвращаем только модифицированное тело, чтобы не конфликтовать с системными заголовками Shadowrocket
        $done({ body: modifiedBody });
    } catch (e) {
        console.log(`[CarScanner] Ответ не является валидным JSON: ${e.message}`);
        $done({});
    }
}