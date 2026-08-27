# 🚀 Shadowrocket iOS Modules Collection

Коллекция модулей, скриптов и правил для **Shadowrocket (iOS)**: блокировка рекламы, умная фильтрация контента, вырезание промо-постов и сниффинг трафика.

---

## 📦 Каталог модулей

| Приложение / Сервис | Описание | Ссылка на установку (в 1 клик) | Документация |
| :--- | :--- | :--- | :--- |
| **VK (ВКонтакте)** | Удаление всей рекламы, промо-постов и трекеров в VK | [Установить 📲](https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/vk/vk-noads.sgmodule) | [Документация](modules/vk/README.md) |
| **VK Sniffer** | Сниффинг API ВКонтакте без вылета чатов и VPN | [Установить 📲](https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/vk/vk-sniffer.sgmodule) | [Документация](modules/vk/README.md) |
| **Avito (Авито)** | Блокировка рекламы, промо-блоков и фильтрация объявлений | [Установить 📲](https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/avito/avito-noads.sgmodule) | [Документация](modules/avito/README.md) |
| **Universal Sniffer** | Универсальный сниффинг и инспекция HTTP(S) трафика | [Установить 📲](https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/sniffer/universal-sniffer.sgmodule) | [Документация](modules/sniffer/README.md) |
| **Universal Cleaner** | Универсальная очистка JSON от рекламы и спама | [Установить 📲](https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/sniffer/universal-cleaner.sgmodule) | [Документация](modules/sniffer/README.md) |

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
│   ├── vk/                        # Модули для VK iOS
│   │   ├── README.md              # Инструкция по VK
│   │   ├── vk-noads.sgmodule      # Блокировка рекламы VK
│   │   ├── vk_cleaner.js          # Скрипт фильтрации VK
│   │   ├── vk-sniffer.sgmodule    # Безопасный сниффер VK
│   │   └── vk_sniffer.js          # Инспектор API VK
│   ├── avito/                     # Модуль для Avito iOS
│   │   ├── README.md
│   │   ├── avito-noads.sgmodule
│   │   └── avito_cleaner.js
│   └── sniffer/                   # Универсальный сниффер и клинер
│       ├── README.md
│       ├── universal-sniffer.sgmodule
│       ├── universal_sniffer.js
│       ├── universal-cleaner.sgmodule
│       └── universal_cleaner.js
└── README.md                      # Главный каталог
```
