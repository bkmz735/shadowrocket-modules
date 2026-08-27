# 🚀 Shadowrocket iOS Modules Collection

Коллекция модулей, скриптов и правил для **Shadowrocket (iOS)**: блокировка рекламы, умная фильтрация контента, удаление телеметрии и сниффинг трафика.

---

## 📦 Каталог модулей

| Приложение / Сервис | Описание | Ссылка на установку (в 1 клик) | Документация |
| :--- | :--- | :--- | :--- |
| **Avito (Авито)** | Блокировка рекламы, промо-блоков и фильтрация объявлений | [Установить 📲](https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/avito/avito-noads.sgmodule) | [Документация](modules/avito/README.md) |
| **Universal Sniffer** | Сниффинг и инспекция HTTP(S) трафика iOS приложений | [Установить 📲](https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/sniffer/universal-sniffer.sgmodule) | [Документация](modules/sniffer/README.md) |
| **Universal Cleaner** | Универсальное вырезание рекламы, спама и промо-блоков из JSON | [Установить 📲](https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/sniffer/universal-cleaner.sgmodule) | [Документация](modules/sniffer/README.md) |

---

## 🛠 Инструкция по установке любого модуля в Shadowrocket

1. **Включение проверки HTTPS (MITM):**
   - Откройте **Shadowrocket** -> **Config** -> нажмите **`i`** напротив активного конфига.
   - В **HTTPS Decryption** нажмите **Generate a New CA** -> **Install CA to System**.
   - На iOS: **Настройки** -> **Основные** -> **VPN и управление устройством** -> установите профиль.
   - На iOS: **Настройки** -> **Основные** -> **Об этом устройстве** -> **Доверие сертификатам** -> включите доверие к корневому сертификату Shadowrocket.

2. **Добавление модуля:**
   - Скопируйте ссылку на нужный `.sgmodule` из таблицы выше.
   - В Shadowrocket перейдите в **Modules (Модули)** -> нажмите **`+`** и вставьте ссылку.
   - Включите тумблер.

---

## 📁 Структура репозитория

```text
├── modules/
│   ├── avito/                     # Модуль для Avito iOS
│   │   ├── README.md              # Инструкция по Avito
│   │   ├── avito-noads.sgmodule   # Основной модуль
│   │   ├── avito_cleaner.js       # Скрипт очистки
│   │   ├── avito-sniffer.sgmodule # Сниффинг трафика
│   │   └── avito_dump.js          # Дамп JSON
│   └── sniffer/                   # Универсальный сниффер и клинер
│       ├── README.md              # Руководство по сниффингу
│       ├── universal-sniffer.sgmodule
│       ├── universal_sniffer.js
│       ├── universal-cleaner.sgmodule
│       └── universal_cleaner.js
└── README.md                      # Главный каталог
```
