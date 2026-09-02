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

        // Ищем массивы (лента, виджеты, баннеры, результаты поиска)
        // depth — защита от stack overflow на глубоко вложенных структурах
        function inspect(obj, path, depth) {
            if (!obj || typeof obj !== 'object' || depth > 6) return;

            if (Array.isArray(obj)) {
                console.log(`\n--- Array at [${path}] (Length: ${obj.length}) ---`);
                const preview = obj.length > 8 ? obj.slice(0, 8) : obj;
                    const itemType = item.type || item.itemType || item.layout || item.kind || item.component || 'UNKNOWN_TYPE';
                    const val = (item.value && typeof item.value === 'object') ? item.value : item;
                    
                    const title = val.title || item.title || 'N/A';
                    const subTitle = val.subTitle || val.subtitle || item.subTitle || item.subtitle || 'N/A';
                    const price = val.price || item.price || val.salary || item.salary || 'N/A';
                    const categoryId = val.categoryId || item.categoryId || (val.analyticParams && val.analyticParams.categoryId) || 'N/A';

                    console.log(`  [${idx}] Type: "${itemType}" | Cat: ${categoryId}`);
                    console.log(`       Title: "${title}"`);
                    console.log(`       SubTitle: "${subTitle}" | Price/Salary: "${price}"`);
                    
                    if (item.value && typeof item.value === 'object') {
                        const valType = item.value.type || item.value.layout || 'N/A';
                        console.log(`       ↳ value.type: "${valType}" | value.keys: [${Object.keys(item.value).slice(0, 10).join(', ')}]`);
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
        // Ответ не в JSON формате — не логируем намеренно
    }
}

$done({});
