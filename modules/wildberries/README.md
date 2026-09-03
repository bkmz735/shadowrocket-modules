# 🫐 Wildberries Module for Shadowrocket

Комплект для анализа трафика и блокировки рекламы в мобильном приложении **Wildberries** на iOS.

---

## 🔍 1. Сниффер трафика (wb-sniffer)

Предназначен для захвата, исследования и выявления рекламных блоков, промо-баннеров и трекеров в приложении Wildberries.

### Файлы:
- [`wb-sniffer.sgmodule`](wb-sniffer.sgmodule) — конфигурация модуля для Shadowrocket.
- [`wb_sniffer.js`](wb_sniffer.js) — скрипт-инспектор JSON ответов.

### Установка сниффера в Shadowrocket:
1. В приложении перейдите во вкладку **Настройки (Config)** -> **Модули (Modules)**.
2. Нажмите **+** и добавьте ссылку:
   ```text
   https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/wildberries/wb-sniffer.sgmodule
   ```
3. Убедитесь, что включен **HTTPS Decryption (MITM)** и установлен корневой сертификат Shadowrocket.
4. Откройте приложение Wildberries, полистайте каталог, поиск и баннеры.
5. Логи запросов и найденные рекламные структуры появятся в разделе Shadowrocket: **Инструменты (Tools)** -> **Логирование скриптов (Script Logs)**.

---

## 🎯 Что ищет сниффер:
- Рекламные баннеры на главной странице (`promo`, `banners`)
- Спонсорские позиции и авторекламу (бустеры) в каталоге и поиске (`catalog.wb.ru`)
- Pop-up акции и уведомления
- Аналитические эндпоинты

После сбора логов будет сформирован рабочий модуль очистки `wb-noads.sgmodule`.
