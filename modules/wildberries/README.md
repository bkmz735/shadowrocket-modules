# 🫐 Wildberries Module for Shadowrocket

Комплект для блокировки рекламы, баннеров, авторекламы в поиске и фоновой телеметрии в приложении **Wildberries** на iOS.

---

## 🛡️ 1. Основной модуль: Блокировка рекламы (`wb-noads`)

### Что делает модуль:
1. **Блокирует внутреннюю телеметрию WB** (устраняет десятки фоновых запросов в секунду):
   - `journal-bt.wildberries.ru` — внутренний журнал действий и кликов пользователя.
   - `a.wb.ru` — трекер поведения и аналитики.
   - `marketplace-sentry.wb.ru` — отправка логов и телеметрии Sentry.
   - `xapi.wildberries.ru/stat/` — аналитика запуска и экранов.
2. **Блокирует промо-баннеры и рекламные сервисы**:
   - `banners-bt.wildberries.ru` и `banners.wb.ru`.
   - Внешние рекламные сети: `googlesyndication.com`, Apple `app-ads-services.com`, Firebase, Google Analytics.
3. **Очищает интерфейс через скрипт `wb_cleaner.js`**:
   - Отключает флаги показа баннеров и навязчивых каруселей в `apps-config.wildberries.ru`.
   - Фильтрует поисковую выдачу и каталог (`catalog.wb.ru`, `napi.wildberries.ru`), удаляя рекламные бустеры и спонсорские товары.

### Установка `wb-noads`:
1. В Shadowrocket перейдите в **Настройки (Config)** -> **Модули (Modules)**.
2. Нажмите **+** и вставьте ссылку:
   ```text
   https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/wildberries/wb-noads.sgmodule
   ```
3. Убедитесь, что включен **HTTPS Decryption (MITM)**.

---

## 🔍 2. Модуль отладки: Сниффер трафика (`wb-sniffer`)

Предназначен для детального анализа структуры запросов и поиска новых рекламных эндпоинтов.

### Установка сниффера:
```text
https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/wildberries/wb-sniffer.sgmodule
```
Логи перехвата выводятся в разделе Shadowrocket: **Инструменты (Tools)** -> **Логирование скриптов (Script Logs)**.

---

## 📁 Структура модуля
- [`wb-noads.sgmodule`](wb-noads.sgmodule) — конфигурация блокировщика рекламы для Shadowrocket.
- [`wb_cleaner.js`](wb_cleaner.js) — скрипт очистки JSON-ответов от рекламы.
- [`wb-sniffer.sgmodule`](wb-sniffer.sgmodule) — конфигурация сниффера.
- [`wb_sniffer.js`](wb_sniffer.js) — скрипт анализа ответов.
