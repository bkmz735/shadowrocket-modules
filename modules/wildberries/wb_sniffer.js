/**
 * 🕵️‍♂️ Wildberries Precise Target Finder
 * Логирует точные URL и JSON-структуры тех самых мест:
 * 1. Экран ЛК и его баннеры
 * 2. Главная страница и плейсхолдер
 * 3. Карточки с рекламой в выдаче
 */

(function () {
    const url = (typeof $request !== "undefined" && $request.url) ? $request.url : "";
    const body = (typeof $response !== "undefined" && $response.body) ? $response.body : null;

    if (body) {
        try {
            const lowerBody = body.toLowerCase();
            const hitWords = ["миксит", "mixit", "шейд", "shade", "здесь все", "здесь всё", "реклама"];
            const matched = hitWords.filter(w => lowerBody.includes(w));

            if (matched.length > 0) {
                console.log(`\n🚨🚨🚨 [WB TARGET CAPTURED!] 🚨🚨🚨`);
                console.log(`[URL]: ${url}`);
                console.log(`[НАЙДЕННЫЕ СЛОВА]: ${matched.join(", ")}`);

                // Показываем фрагмент ответа, где встретилось слово
                matched.forEach(w => {
                    const pos = lowerBody.indexOf(w);
                    const snippet = body.slice(Math.max(0, pos - 150), Math.min(body.length, pos + 250));
                    console.log(`\n🔍 [КОНТЕКСТ ДЛЯ "${w}"]:`);
                    console.log(`...${snippet}...\n`);
                });
                console.log(`========================================\n`);
            }
        } catch (e) {}
    }

    $done({});
})();
