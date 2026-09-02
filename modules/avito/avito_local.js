/**
 * Avito Local Priority — http-request скрипт для Shadowrocket
 * Принудительно выставляет localPriority=1 в URL запросов к API Avito.
 * Это заставляет выдачу показывать сначала объявления из твоего города.
 *
 * Аргумент: 1 = включено, 0 = выключено
 */

const enabled = (typeof $argument !== 'undefined' && String($argument).trim() === '1');

if (enabled) {
    let url = $request.url;

    if (url.includes('localPriority=')) {
        // Заменяем существующее значение на 1
        url = url.replace(/localPriority=\d+/, 'localPriority=1');
    } else if (url.includes('?')) {
        // Параметры уже есть — дописываем
        url += '&localPriority=1';
    } else {
        // Параметров нет — начинаем query string
        url += '?localPriority=1';
    }

    $done({ url: url });
} else {
    $done({});
}
