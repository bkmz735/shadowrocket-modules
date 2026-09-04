# 🚀 Shadowrocket iOS Modules Collection

Коллекция специализированных модулей и инструментов для **Shadowrocket (iOS)**: вырезание рекламы, спуфинг геолокации, разблокировка функций и глубокий анализ трафика.

---

## 📦 Каталог модулей

| Приложение / Сервис | Категория | Описание | Ссылка на установку (в 1 клик) | Документация |
| :--- | :--- | :--- | :--- | :--- |
| **Spotify Premium** | 🎵 Музыка | Разблокировка функций Premium, выбор любого трека, снятие ограничений мобильного клиента, блокировка рекламы | [Установить 📱](https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/spotify/spotify-premium.sgmodule) | [Документация](modules/spotify/README.md) |
| **iOS Location Spoofer** | 📍 Геолокация | Спуфинг системных координат Apple Location Services (/clls/wloc), 70+ городов, высота над уровнем моря, push-уведомления | [Установить 📱](https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/location-spoofer/location-spoofer.sgmodule) | [Документация](modules/location-spoofer/README.md) |
| **Wildberries** | 🛍️ Маркетплейс | Блокировка рекламы, баннеров, промо-слайдеров, рекламных бустеров в поиске и фоновой телеметрии | [Установить 📱](https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/wildberries/wb-noads.sgmodule) | [Документация](modules/wildberries/README.md) |
| **Ozon** | 🛍️ Маркетплейс | Блокировка рекламы, видео-баннеров, модалок, промо Ozon Банка (карты/кредиты), спам-чатов и трекеров | [Установить 📱](https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/ozon/ozon-noads.sgmodule) | [Документация](modules/ozon/README.md) |
| **Avito** | 📢 Доска объявлений | Блокировка рекламы, стоп-слова, фильтр по цене и категориям, приоритет своего города | [Установить 📱](https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/avito/avito-noads.sgmodule) | [Документация](modules/avito/README.md) |
| **GetContact** | 📞 Утилиты | DNS-блокировка рекламы и трекеров + патч открытого эндпоинта против инициализации рекламных SDK | [Установить 📱](https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/getcontact/getcontact-noads.sgmodule) | [Документация](modules/getcontact/README.md) |

---

## 🔍 Диагностические модули (Снифферы)

Для анализа сетевых запросов и реверс-инжиниринга API внутри каталогов также доступны инструменты диагностики:
- **Spotify Traffic Sniffer**: [spotify-sniffer.sgmodule](modules/spotify/spotify-sniffer.sgmodule)
- **Wildberries ORD & ERID Hunter**: [wb-sniffer.sgmodule](modules/wildberries/wb-sniffer.sgmodule)
- **Ozon Chat & Deep Sniffer**: [ozon-sniffer.sgmodule](modules/ozon/ozon-sniffer.sgmodule)
- **Avito Traffic Inspector**: [avito-sniffer.sgmodule](modules/avito/avito-sniffer.sgmodule)

---

## 🛠 Инструкция по установке модуля в Shadowrocket

1. **Настройка HTTPS (MITM):**
   - Откройте **Shadowrocket** -> **Config** -> нажмите **i** напротив активного профиля.
   - В **HTTPS Decryption** нажмите **Generate a New CA** -> **Install CA to System**.
   - На iOS: **Настройки** -> **Основные** -> **VPN и управление устройством** -> установите профиль.
   - На iOS: **Настройки** -> **Основные** -> **Об этом устройстве** -> **Доверие сертификатам** -> включите доверие к корневому сертификату Shadowrocket.

2. **Добавление модуля:**
   - Скопируйте ссылку на .sgmodule из таблицы выше.
   - В Shadowrocket перейдите в **Modules (Модули)** -> нажмите **+** и вставьте ссылку.
   - Включите тумблер напротив добавленного модуля.

---

## 📁 Структура репозитория

`	ext
├── modules/
│   ├── spotify/                # Модуль Spotify (iOS)
│   │   ├── README.md           # Документация модуля
│   │   ├── API_STRUCTURE.md    # Карта API и структура трафика
│   │   ├── spotify-premium.sgmodule  # Основной модуль Shadowrocket
│   │   ├── spotify-proto.js    # Модификация ответов Protobuf
│   │   ├── spotify-json.js     # Спуфинг платформы iPad
│   │   ├── spotify-sniffer.sgmodule  # Сниффер запросов
│   │   └── spotify_sniffer.js  # Скрипт логирования сетевых событий
│   │
│   ├── location-spoofer/       # Модуль подмены системной геолокации Apple (iOS)
│   │   ├── README.md           # Документация и список поддерживаемых городов
│   │   ├── location-spoofer.sgmodule # Основной модуль Shadowrocket
│   │   └── location-spoofer.js # Скрипт перехвата и генерации WLoc/ARPC
│   │
│   ├── wildberries/            # Модуль Wildberries (iOS)
│   │   ├── README.md           # Документация модуля
│   │   ├── wb-noads.sgmodule   # Модуль блокировки рекламы
│   │   ├── wb_cleaner.js       # Скрипт очистки JSON-ответов
│   │   ├── wb-sniffer.sgmodule # Сниффер рекламных баннеров (ОРД/ЕРИД)
│   │   └── wb_sniffer.js       # Скрипт сниффера
│   │
│   ├── ozon/                   # Модуль Ozon (iOS)
│   │   ├── README.md           # Документация модуля
│   │   ├── ozon-noads.sgmodule # Модуль блокировки рекламы и баннеров
│   │   ├── ozon_cleaner.js     # Скрипт очистки выдачи и чатов
│   │   ├── ozon-sniffer.sgmodule # Сниффер эндпоинтов Ozon
│   │   └── ozon_sniffer.js     # Скрипт логирования структуры
│   │
│   ├── avito/                  # Модуль Avito (iOS)
│   │   ├── README.md           # Документация и настройка аргументов
│   │   ├── API_STRUCTURE.md    # Карта API Avito
│   │   ├── avito-noads.sgmodule# Модуль блокировки рекламы и фильтрации
│   │   ├── avito_cleaner.js    # Скрипт фильтрации по стоп-словам и цене
│   │   ├── avito_local.js      # Скрипт приоритета объявлений своего города
│   │   ├── avito-sniffer.sgmodule # Сниффер структуры API
│   │   └── avito_dump.js       # Скрипт инспектора структуры данных
│   │
│   └── getcontact/             # Модуль GetContact (iOS/Android)
│       ├── README.md           # Документация модуля
│       ├── getcontact-noads.sgmodule # DNS-блокировка и перехват SDK
│       └── getcontact_cleaner.js     # Скрипт блокировки инициализации SDK
│
├── .gitignore                  # Исключение тестовых и служебных файлов
└── README.md                   # Главный каталог модулей
`