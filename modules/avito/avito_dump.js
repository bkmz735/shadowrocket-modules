/**
 * Скрипт-дампер структуры API Avito для Shadowrocket
 * Выводит в лог структуру JSON (ключи, массивы, типы элементов), не ломая трафик.
 */

const url = $request.url;
const body = $response.body;

const URL_PATTERNS = ['/api/', '/core/', 'json', '/feed', '/search', '/main', '/screen'];
const urlMatches = body && URL_PATTERNS.some(p => url.includes(p));

if (urlMatches) {
    try {
        const data = JSON.parse(body);

        console.log(`\n================== [AVITO API HIT] ==================`);
        console.log(`URL: ${url}`);

        // Анализируем верхнеуровневые ключи
        console.log(`Root Keys: ${JSON.stringify(Object.keys(data))}`);

        // Глубокий инспектор элементов выдачи и карточек
        function inspect(obj, path, depth) {
            if (!obj || typeof obj !== 'object' || depth > 5) return;

            if (Array.isArray(obj)) {
                // Если массив содержит объекты
                if (obj.length > 0 && typeof obj[0] === 'object' && obj[0] !== null) {
                    console.log(`\n--- Array at [${path}] (Length: ${obj.length}) ---`);
                    const preview = obj.length > 10 ? obj.slice(0, 10) : obj;
                    for (let idx = 0; idx < preview.length; idx++) {
                        const raw = preview[idx];
                        if (!raw || typeof raw !== 'object') continue;

                        const item = raw.item || raw.value || raw;
                        const itemType = raw.type || raw.itemType || raw.layout || item.type || item.layout || 'UNKNOWN_TYPE';
                        
                        const title = item.title || raw.title || 'N/A';
                        const subTitle = item.subTitle || item.subtitle || raw.subTitle || raw.subtitle || 'N/A';
                        const price = item.price || raw.price || item.salary || raw.salary || item.priceValue || 'N/A';
                        const cat = item.categoryId || raw.categoryId || (item.analyticParams && item.analyticParams.categoryId) || 'N/A';
                        const vert = item.verticalId || raw.verticalId || (item.analyticParams && item.analyticParams.vertical_id) || 'N/A';

                        // Извлекаем все текстовые строки для поиска скрытых полей с ценой/зарплатой
                        const stringFields = [];
                        for (let k in item) {
                            if (typeof item[k] === 'string' && item[k].length < 100) {
                                stringFields.push(`${k}: "${item[k]}"`);
                            }
                        }

                        console.log(`\n[${idx}] Type: "${itemType}" | Cat: ${cat} | Vert: "${vert}"`);
                        console.log(`     Title: "${title}"`);
                        console.log(`     SubTitle: "${subTitle}"`);
                        console.log(`     Price/Salary: "${price}"`);
                        if (stringFields.length > 0) {
                            console.log(`     Fields: [${stringFields.slice(0, 5).join('; ')}]`);
                        }
                    }
                }
            } else {
                for (const k in obj) {
                    if (obj[k] && typeof obj[k] === 'object') {
                        inspect(obj[k], path ? `${path}.${k}` : k, depth + 1);
                    }
                }
            }
        }

        inspect(data, '', 0);
        console.log(`=====================================================\n`);
    } catch (e) {
        // Ответ не в JSON формате
    }
}

$done({});
