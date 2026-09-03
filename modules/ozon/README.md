# 🛍️ Ozon NoAds & Sniffer (Shadowrocket Module)

Модуль для Shadowrocket (iOS), созданный на основе реального сниффинга сетевой структуры Ozon Composer Engine.
Блокирует рекламные баннеры, видео-рекламу, модальные алерты, промо-плашки акций и банковских карт, а также аналитические трекеры.

---

## ⚡ Единая постоянная ссылка для установки

Скопируйте ссылку и добавьте в **Shadowrocket** -> **Modules (Модули)** -> **+**:
`	ext
https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/ozon/ozon-noads.sgmodule
`

*(Для будущих обновлений достаточно просто нажимать **Update** в Shadowrocket)*

---

## 🎯 Что блокирует и очищает модуль

- **Главный экран (/home)**:
  - dvBanner — главный верхний рекламный баннер.
  - dvVideoBannerMobile — автовоспроизводящиеся видео-баннеры.
  - dvRefreshWithDelay — автоподгрузка новой рекламы в фоне.
- **Личный кабинет / Профиль (/my)**:
  - entryBannerWidget — промо-плашки лотерей («Джекпот 15 млн» и др.).
- **Раздел финансов / Ozon Банк (/finance/banklanding)**:
  - Блокировка модалок order-card и setBannerAction (оформление карты / кредитки).
  - Удаление промо-баннеров и плашек кредитных предложений.
- **Разделители и разметка**:
  - Удаляет пустые разделители (separator, islandSeparator), чтобы не оставалось дыр в интерфейсе.
- **Аналитика и трекеры**:
  - p-api/tracker/ (телеметрия действий).
  - p.ozon.ru/imp (пиксели показов).
  - sentry.ozon.ru (краш-трекер).
  - AppMetrica, Adjust, MyTarget, VK Analytics.

---

## ⚙️ Требования
1. Включенный **HTTPS Decryption (MITM)** в Shadowrocket.
2. Установленный и доверенный CA-сертификат Shadowrocket.