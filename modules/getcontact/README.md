# 📞 GetContact AdBlock (DNS + API Patch)

Комплексный модуль для блокировки рекламы в GetContact (iOS/Android).

В связи с тем, что GetContact шифрует 90% своих ответов, этот модуль использует уникальную уязвимость: он перехватывает единственный открытый эндпоинт (`/event-enabled`) и принудительно запрещает приложению инициализировать рекламные SDK (AdMob, AppLovin, Yandex). Для максимальной надёжности также используются DNS-блокировки серверов рекламы.

---

## 🚀 Установка
Скопируйте ссылку на модуль и вставьте в **Shadowrocket** -> **Modules (Модули)** -> **`+`**:
[Ссылка на установку (в 1 клик)](https://raw.githubusercontent.com/bkmz735/shadowrocket-modules/main/modules/getcontact/getcontact-noads.sgmodule)
