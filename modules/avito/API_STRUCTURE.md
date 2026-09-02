# 📡 Справочник API Avito (iOS App)

В этом файле собрана полная структура запросов и ответов API мобильного приложения Avito для iOS, полученная в ходе сниффинга трафика. Используйте его как шпаргалку для создания новых правил и фильтров.

---

## 1. Основные эндпоинты API (Endpoints)

| Метод / URL | Назначение | Особенности |
|---|---|---|
| `GET /api/3/main/items` | **Главная страница (Рекомендации)** | Выдача вперемешку (товары, вакансии, услуги). Карточки обернуты в `{ item: { ... } }`. |
| `GET /api/11/items` | **Поисковая выдача / Каталог** | Основная лента при поиске по категориям или ключевым словам. |
| `GET /api/5/items/search/header` | **Фильтры и метаданные поиска** | Список доступных фильтров, категорий, радиуса и сортировки. |
| `GET /api/18/suggest` | **Подсказки поисковой строки** | Поисковые саджесты и история поиска (`bubble_group`, `text_item_v3`). |
| `GET /api/19/items/{id}` | **Полная карточка объявления** | Детальные данные объявления (описание, контакты, параметры, зарплата). |
| `GET /api/1/adv/network/banner` | **Сетевая баннерная реклама** | Загрузка внешних рекламных креативов и трекинг-пикселей. |
| `GET /api/2/items/{id}/banners` | **Баннеры внутри карточки товара** | Промо-блоки внутри конкретного объявления. |
| `POST /clickstream/events/0/proto` | **Телеметрия / Кликстрим** | Отправка всех действий пользователя (клики, скроллы) через Protobuf. |

---

## 2. Параметры URL в запросах (Request Query Params)

| Параметр | Пример значения | Описание |
|---|---|---|
| `locationId` | `637640` (Москва) | ID выбранного города/региона. |
| `localPriority` | `1` или `0` | **`1` = «Сначала из этого города»**, `0` = выдача по всей РФ / с доставкой. |
| `categoryId` | `111` | Числовой ID категории (`111` — Вакансии, `112` — Резюме, `114` — Услуги, `4` — Авто, `2` — Недвижимость). |
| `context` | `jobVacancies`, `service` | Текстовый контекст раздела (закодирован или передан строкой). |
| `query` | `%D0%BF%D0%BE%D0%B4%D1%80%D0%B0%D0%B1%D0%BE%D1%82%D0%BA%D0%B0` | Текст поискового запроса. |
| `geoCoords` | `55.7558,37.6173` | Точные GPS-координаты устройства. |
| `page` / `offset` | `1` / `33` | Пагинация ленты. |

---

## 3. Категории и ссылки (Categories & URL Markers)

На главной странице категория часто не передается в `categoryId`, но всегда присутствует в ссылке **`uri_mweb`**:

| Раздел | `categoryId` | Маркер в `uri_mweb` | Примеры |
|---|---|---|---|
| **Вакансии** | `111` | `/vakansii/`, `/podrabotka/` | `/moskva/vakansii/sborschik_8330526388` |
| **Резюме** | `112` | `/rezume/` | `/moskva/rezume/voditel_123456` |
| **Услуги** | `114` | `/uslugi/` | `/moskva/uslugi/remont_kvartir_987654` |
| **Транспорт (Авто)** | `4` | `/avtomobili/`, `/transport/`, `/zapchasti_i_aksessuary/` | `/moskva/avtomobili/vaz_2114_555666` |
| **Недвижимость** | `2` | `/kvartiry/`, `/nedvizhimost/`, `/kommercheskaya_nedvizhimost/` | `/moskva/kvartiry/prodam_2k_111222` |
| **Электроника** | `6` | `/telefony/`, `/noutbuki/`, `/audio_i_video/` | `/moskva/telefony/iphone_15_pro_333444` |

---

## 4. Структура JSON в ответах (Response Structures)

### А. Карточка в выдаче главной страницы (`api/3/main/items`)
```json
{
  "item": {
    "id": "8330526388",
    "title": "Сборщик-техник дронов бпла",
    "price": "от 210 000 ₽ на руки",
    "location": "Москва",
    "uri_mweb": "/moskva/vakansii/sborschik-tehnik_dronov_bpla_8330526388",
    "userType": "private",
    "images": [
      { "720x540": "https://90.img.avito.st/image/..." }
    ]
  }
}
```

### Б. Карточка в поисковой выдаче раздела (`api/11/items`)
```json
{
  "type": "item",
  "value": {
    "id": 8230226781,
    "title": "Перевозчик беспилотных аппаратов",
    "price": "233 000 — 449 000 ₽ на руки",
    "subTitle": "233 000 — 449 000 ₽ в месяц",
    "categoryId": 111,
    "verticalId": "jobs",
    "jobRknDisclaimer": "Работа",
    "salary": 233000,
    "salaryValue": 449000,
    "analyticParams": {
      "categoryId": 111,
      "vertical_id": "jobs"
    }
  }
}
```

### В. Мусорные / Рекламные виджеты в ленте (подлежат удалению)
```json
// Баннерная реклама
{
  "type": "banner",
  "value": { "list": [...], "size": "big" }
}

// Сетевая промо-плашка
{
  "type": "advBannerWidget",
  "value": { "bannerCode": "main_widget_ios" }
}

// Рекомендательные карусели
{
  "type": "itemsCarouselWidget",
  "value": { "title": "Вы смотрели", "displayType": "carousel_vacancy" }
}

// Блоки историй
{
  "type": "storiesWidget",
  "value": { "preview": "circle" }
}
```

---

## 5. Поля для извлечения цен и зарплат (Price Fields)

В Avito цена может храниться в самых разных полях в зависимости от категории и версии API:

1. `item.price` / `item.value.price` — число (`50000`) или форматированная строка (`"от 210 000 ₽ на руки"`).
2. `item.salary` / `item.value.salary` — числовое значение зарплаты.
3. `item.salaryValue` / `item.value.salaryValue` — верхняя планка зарплаты.
4. `item.subTitle` / `item.value.subTitle` — текстовая строка подзаголовка (например, `"260 000 ₽ в месяц"`).
5. `item.priceDetailed.value` — точное числовое значение в копейках или рублях.
6. `item.priceRur` / `item.priceValue` — альтернативные числовые поля.
