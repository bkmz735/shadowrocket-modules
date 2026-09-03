# 🛍️ Ozon NoAds & Sniffer (Shadowrocket Module)

Модуль для Shadowrocket (iOS), созданный на основе реального сниффинга сетевой структуры Ozon Composer Engine.
Блокирует рекламные баннеры, видео-рекламу, промо-плашки акций и банковских продуктов, а также аналитические трекеры.

---

## ⚡ Быстрая установка

1. Скопируйте ссылку на основной модуль:
   `	ext
   https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/ozon/ozon-noads.sgmodule?v=2
   `
2. Откройте **Shadowrocket** -> вкладка **Config** -> **Modules (Модули)** -> нажмите **+** и вставьте URL.

---

## 🎯 Что блокирует и очищает модуль

- **Главный экран (/home)**:
  - dvBanner — главный верхний рекламный баннер.
  - dvVideoBannerMobile — автовоспроизводящиеся видео-баннеры.
  - dvRefreshWithDelay — автоподгрузка новой рекламы в фоне.
- **Личный кабинет / Профиль (/my)**:
  - entryBannerWidget — промо-плашки лотерей («Джекпот 15 млн» и др.).
- **Раздел финансов (/finance/banklanding)**:
  - dBanner — рекламные предложения кредитных продуктов.
  - anner в модальных окнах (/modal/alert/).
- **Разделители и разметка**:
  - Синхронно удаляет пустые разделители (separator, islandSeparator), предотвращая появление дыр в дизайне.
- **Аналитика и трекеры**:
  - p-api/tracker/ (телеметрия действий).
  - p.ozon.ru/imp (пиксели учета показов).
  - sentry.ozon.ru (краш-репорты).
  - AppMetrica, Adjust, MyTarget, VK Analytics.

---

## ⚙️ Требования
1. Включенный **HTTPS Decryption (MITM)** в Shadowrocket.
2. Установленный и доверенный CA-сертификат Shadowrocket.