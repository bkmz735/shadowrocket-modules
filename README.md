# 🚀 Shadowrocket iOS Modules Collection

Коллекция специализированных модулей и инструментов для **Shadowrocket (iOS)**: вырезание рекламы, умная фильтрация контента и сниффинг трафика.

---

## 📦 Каталог модулей

| Приложение / Сервис | Описание | Ссылка на установку (в 1 клик) | Документация |
| :--- | :--- | :--- | :--- |
| **Universal Sniffer** | Универсальный сниффер и инспектор HTTP(S) трафика | [Установить 📲](https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/sniffer/universal-sniffer.sgmodule) | [Документация](modules/sniffer/README.md) |
| **Avito (Авито)** | Блокировка рекламы, промо-блоков и фильтрация объявлений | [Установить 📲](https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/avito/avito-noads.sgmodule) | [Документация](modules/avito/README.md) |

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
│   ├── avito/                     # Модуль для Avito iOS
│   │   ├── README.md
│   │   ├── avito-noads.sgmodule
│   │   └── avito_cleaner.js
│   └── sniffer/                   # Универсальный сниффер
│       ├── README.md
│       ├── universal-sniffer.sgmodule
│       └── universal_sniffer.js
└── README.md                      # Главный каталог
```
