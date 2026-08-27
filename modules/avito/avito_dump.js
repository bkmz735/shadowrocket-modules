/**
 * Скрипт-дампер структуры API Avito для Shadowrocket
 * Выводит в лог структуру JSON (ключи, массивы, типы элементов), не ломая трафик.
 */
const url = $request.url;
const body = $response.body;

if (body && (url.includes('/api/') || url.includes('/core/') || url.includes('json') || url.includes('/feed') || url.includes('/search') || url.includes('/main') || url.includes('/screen'))) {
    try {
        const data = JSON.parse(body);
        
        console.log(`\n================== [AVITO API HIT] ==================`);
        console.log(`URL: ${url}`);
        
        // Анализируем верхнеуровневые ключи
        const keys = Object.keys(data);
        console.log(`Root Keys: ${JSON.stringify(keys)}`);
        
        // Ищем массивы (лента, виджеты, баннеры, результаты поиска)
        function inspect(obj, path = '') {
            if (!obj || typeof obj !== 'object') return;
            
            if (Array.isArray(obj)) {
                console.log(`\n--- Array at [${path}] (Length: ${obj.length}) ---`);
                obj.slice(0, 8).forEach((item, idx) => {
                    if (item && typeof item === 'object') {
                        const itemType = item.type || item.itemType || item.layout || item.kind || item.component || 'UNKNOWN_TYPE';
                        const itemKeys = Object.keys(item).slice(0, 10);
                        console.log(`  [${idx}] Type: "${itemType}" | Keys: [${itemKeys.join(', ')}]`);
                        
                        if (item.value && typeof item.value === 'object') {
                            const valType = item.value.type || item.value.layout || 'N/A';
                            console.log(`       ↳ value.type: "${valType}" | value.keys: [${Object.keys(item.value).slice(0, 6).join(', ')}]`);
                        }
                    }
                });
            } else {
                for (let k in obj) {
                    if (typeof obj[k] === 'object' && obj[k] !== null) {
                        inspect(obj[k], path ? `${path}.${k}` : k);
                    }
                }
            }
        }
        
        inspect(data);
        console.log(`=====================================================\n`);
    } catch (e) {
        // Ответ не в JSON формате
    }
}

$done({});
