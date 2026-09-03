/**
 * 🫐 Wildberries Inspector - UI & Promo Targets
 * Безопасно инспектирует баннеры, главную, ЛК и промо WB Банка (без падений VPN)
 */

const url = $request ? $request.url : "";
const body = (typeof $response !== "undefined" && $response.body) ? $response.body : null;

if (body) {
    try {
        const data = JSON.parse(body);

        // 1. Баннеры и промо на главной
        if (url.includes("banners-bt.wildberries.ru")) {
            console.log(`\n================== [WB: БАННЕРЫ И ПРОМО] ==================`);
            const banners = Array.isArray(data) ? data : (data.banners || data.items || data.promo || []);
            console.log(`Найдено баннеров: ${banners.length}`);
            banners.slice(0, 15).forEach((b, i) => {
                const title = b.title || b.name || b.header || b.text || "Без заголовка";
                const link = b.actionUrl || b.link || b.url || "";
                console.log(`  🎯 Баннер #${i + 1}: "${title}" | Link: ${link}`);
            });
            console.log(`===========================================================\n`);
        }

        // 2. Личный кабинет (ЛК): профиль, плашки и виджеты
        else if (url.includes("ui-bt.wildberries.ru")) {
            console.log(`\n================== [WB: ЛИЧНЫЙ КАБИНЕТ (ЛК)] ==================`);
            console.log(`URL: ${url}`);
            console.log(`Ключи экрана ЛК: ${JSON.stringify(Object.keys(data.data || data))}`);
            
            // Сканируем виджеты в профиле
            const root = data.data || data;
            for (const k in root) {
                if (Array.isArray(root[k])) {
                    console.log(`  📁 Секция "${k}" (${root[k].length} эл.):`);
                    root[k].slice(0, 5).forEach((item, idx) => {
                        const title = item.title || item.header || item.name || item.text || "";
                        const sub = item.subTitle || item.subtitle || item.description || "";
                        const type = item.type || item.kind || "";
                        if (title || sub) {
                            console.log(`     [${idx}] Type: "${type}" | "${title}" - "${sub}"`);
                        }
                    });
                }
            }
            console.log(`===============================================================\n`);
        }

        // 3. WB Банк / Баланс / Рассрочки
        else if (
            url.includes("wb-balance.wildberries.ru") ||
            url.includes("installments-aggregator-bt.wildberries.ru") ||
            url.includes("chances.wildberries.ru")
        ) {
            console.log(`\n================== [WB: БАНК / РАССРОЧКА / ЛОТЕРЕИ] ==================`);
            console.log(`URL: ${url}`);
            const sample = JSON.stringify(data).slice(0, 400);
            console.log(`Ответ: ${sample}`);
            console.log(`======================================================================\n`);
        }

        // 4. Главная страница (home-service)
        else if (url.includes("home-service.wildberries.ru/home-service/api/v1/home")) {
            console.log(`\n================== [WB: ГЛАВНАЯ СТРАНИЦА] ==================`);
            if (data.data) {
                for (const k in data.data) {
                    if (Array.isArray(data.data[k])) {
                        console.log(`  -> Блок "${k}": ${data.data[k].length} шт.`);
                    }
                }
            }
            console.log(`============================================================\n`);
        }

    } catch (e) {}
}

$done({});
