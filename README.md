# 🚀 Shadowrocket iOS Modules Collection

Коллекция специализированных модулей и инструментов для **Shadowrocket (iOS)**: вырезание рекламы и умная фильтрация контента.

---

## 📦 Каталог модулей

| Приложение / Сервис | Описание | Ссылка на установку (в 1 клик) | Документация |
| :--- | :--- | :--- | :--- |
| **Wildberries (Вайлдберриз)** | Блокировка рекламы, баннеров, бустеров в поиске и телеметрии | [Установить 📱](https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/wildberries/wb-noads.sgmodule) | [Документация](modules/wildberries/README.md) |
| **Ozon (Озон)** | Блокировка рекламы, промо-баннеров Ozon Банка и трекеров | [Установить 📱](https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/ozon/ozon-noads.sgmodule) | [Документация](modules/ozon/README.md) |
| **Avito (Авито)** | Блокировка рекламы, промо-блоков и фильтрация объявлений | [Установить 📱](https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/avito/avito-noads.sgmodule) | [Документация](modules/avito/README.md) |
| **GetContact** | DNS-Блокировка рекламы, аналитики и трекеров | [Установить 📱](https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/getcontact/getcontact-noads.sgmodule) | [Документация](modules/getcontact/README.md) |

---

## 🛠 Инструкция по установке модуля в Shadowrocket

1. **Настройка HTTPS (MITM):**
   - Откройте **Shadowrocket** -> **Config** -> нажмите **`i`** напротив активного профиля.
   - В **HTTPS Decryption** нажмите **Generate a New CA** -> **Install CA to System**.
   - На iOS: **Настройки** -> **Основные** -> **VPN и управление устройством** -> установите профиль.
   - На iOS: **Настройки** -> **Основные** -> **Об этом устройстве** -> **Доверие сертификатам** -> включите доверие к корневому сертификату Shadowrocket.

2. **Добавление модуля:**
   - Скопируйте ссылку на `.sgmodule` из таблицы выше.
   - В Shadowrocket перейдите в **Modules (Модули)** -> нажмите **`+`** и вставьте ссылку.
   - Включите тумблер.

---

## 📁 Структура репозитория

```text
├── modules/
│   ├── wildberries/            # Модуль для Wildberries (iOS)
│   │   ├── README.md
│   │   ├── wb-noads.sgmodule
│   │   ├── wb_cleaner.js
│   │   ├── wb-sniffer.sgmodule
│   │   └── wb_sniffer.js
│   ├── ozon/                   # Модуль для Ozon (iOS)
│   ├── avito/                  # Модуль для Avito iOS
│   └── getcontact/             # Модуль для GetContact (iOS/Android)
└── README.md                   # Главный каталог
```
