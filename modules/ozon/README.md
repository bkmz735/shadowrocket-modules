# 🛍️ Ozon NoAds & Sniffer (Shadowrocket Module)

Модуль для Shadowrocket (iOS), предназначенный для блокировки трекеров, аналитики, рекламных баннеров и промо-блоков в приложении **Ozon**, а также сниффинга/отладки API ответов.

---

## ⚡ Быстрая установка

1. Скопируйте ссылку на модуль:
   - **Основной (NoAds)**:
     `	ext
     https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/ozon/ozon-noads.sgmodule
     `
   - **Отладка и анализ API (Sniffer)**:
     `	ext
     https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/ozon/ozon-sniffer.sgmodule
     `
2. Откройте **Shadowrocket** -> вкладка **Config** -> **Modules (Модули)** -> нажмите **+** и вставьте URL.

---

## ⚙️ Настройка MITM

Для работы модификации ответов и фильтрации виджетов:
1. Включите **HTTPS Decryption** в Shadowrocket.
2. Установите и включите доверие корневому CA-сертификату Shadowrocket (*Настройки iOS -> Основные -> Об этом устройстве -> Доверие сертификатам*).

---

## 📦 Состав модуля

- [ozon-noads.sgmodule](file:///c:/projects/shadowrocket-modules/modules/ozon/ozon-noads.sgmodule) — конфигурация с правилами REJECT для метрик/трекеров и скриптом фильтрации.
- [ozon_cleaner.js](file:///c:/projects/shadowrocket-modules/modules/ozon/ozon_cleaner.js) — скрипт парсинга и удаления рекламных баннеров / промо-виджетов из JSON ответов.
- [ozon-sniffer.sgmodule](file:///c:/projects/shadowrocket-modules/modules/ozon/ozon-sniffer.sgmodule) — модуль для дампинга и исследования API запросов Ozon в логи.
- [ozon_sniffer.js](file:///c:/projects/shadowrocket-modules/modules/ozon/ozon_sniffer.js) — скрипт логирования API структур в консоль.