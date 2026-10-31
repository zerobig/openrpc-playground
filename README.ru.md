# OpenRPC Viewer & Playground

[English](README.md) | **Русский**

[![CI](https://github.com/zerobig/openrpc-playground/actions/workflows/ci.yml/badge.svg)](https://github.com/zerobig/openrpc-playground/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](tsconfig.json)

Standalone-просмотрщик и playground для [OpenRPC](https://spec.open-rpc.org/)
схем, работающий прямо в браузере. Загружаете схему по URL, просматриваете
методы и типы, изучаете параметры и ошибки, отправляете JSON-RPC 2.0 запросы
(включая batch) — всё без бэкенда.

Собран на TypeScript + Vite. При сборке инлайнится в **один `index.html`**
через [`vite-plugin-singlefile`](https://github.com/richardtallent/vite-plugin-singlefile).
Можно положить на любой статический хостинг, приложить к тикету или открыть
локально.

> Изначально сделан для изучения RPC-сервисов 1С:Предприятия (`Demo_RPC`), но
> работает с любым OpenRPC 1.x документом.

## Возможности

- **Загрузка схемы по URL** — без аплоада, прямо по ссылке на `openrpc.json`.
- **Браузер методов и типов** — с группировкой по namespace и поиском по
  имени, `summary` и `description`.
- **`summary` + `description`** — короткое summary видно всегда, длинное
  описание свёрнуто в `<details>`.
- **Переход по `$ref`** — `#/components/schemas/Foo` отображается как ссылка
  и ведёт на `type:Foo` в дереве.
- **Playground** — редактируемые JSON-параметры, отправка одиночных вызовов,
  HTTP-статус, время, тело ответа (pretty JSON).
- **Batch-запросы** — очередь из нескольких методов, отправка одним
  JSON-RPC batch. Целевой сервер показан в шапке.
- **Authorization header** — необязательный заголовок `Authorization` на
  каждый метод (`Basic …` и т.п.). Полезно для 1С-сервисов с
  `UseBasicAuth = Истина`.
- **Ошибки из `method.errors`** — таблица «Возможные ошибки» до отправки.
- **i18n** — английский (по умолчанию) и русский, переключатель в шапке.
  `?lang=en|ru` переопределяет сохранённый выбор; `?spec=<url>` автозагружает
  схему.
- **Никакого бэкенда и трекинга** — всё работает локально в браузере.

## Быстрый старт

### Готовый single-file

Возьмите последний `dist/index.html` из
[Releases](https://github.com/zerobig/openrpc-playground/releases) и откройте
в браузере:

```
file:///path/to/index.html?spec=https://example.com/openrpc.json
```

> **CORS.** При открытии через `file://` кросс-доменные `fetch` к URL схемы
> и к JSON-RPC серверу могут блокироваться браузером. Для локальной работы
> отдайте `dist/` любым статическим сервером:
>
> ```bash
> npx serve dist
> # или
> python -m http.server -d dist
> ```

### Сборка из исходников

Нужен Node.js 18+ (см. `.nvmrc`).

```bash
git clone https://github.com/zerobig/openrpc-playground.git
cd openrpc-playground
npm install
npm run build
# → dist/index.html
```

## Разработка

```bash
npm run dev
```

Поднимает Vite dev-сервер с HMR на `http://localhost:5173`. Параметры URL
передаются напрямую:

```
http://localhost:5173/?spec=https://example.com/openrpc.json&lang=ru
```

`npm run build` сначала запускает `tsc` (type-check, `noEmit`), затем
`vite build`. Ошибка типов роняет сборку.

## Использование

1. **Загрузите схему** — вставьте URL OpenRPC JSON в шапку и нажмите
   *Загрузить* (или `Enter`). Либо добавьте `?spec=<url>` к адресу страницы.
2. **Навигация** — методы сгруппированы по namespace-префиксу
   (`Products.Get` → группа `Products`). Типы — в группе *Типы*. Поиск —
   в левой панели.
3. **Карточка метода** — summary, description, параметры (с `$ref`-ссылками),
   результат, возможные ошибки, примеры.
4. **Отправка** — отредактируйте JSON в *Playground*, при необходимости
   заполните *Authorization*, нажмите *Отправить* (или `Ctrl/Cmd + Enter`).
   Ответ появится ниже: статус, время, тело.
5. **Batch** — жмите *+ В batch* на нескольких методах (можно разных),
   затем *Отправить batch*. Batch уйдёт на сервер **первого** элемента
   очереди; целевой сервер показан в шапке панели.
6. **Язык** — EN/RU переключается в шапке. Выбор сохраняется в
   `localStorage`.

## Параметры URL

| Параметр | Действие                                                | Пример                         |
| -------- | ------------------------------------------------------- | ------------------------------ |
| `spec`   | Автозагрузка OpenRPC-схемы по URL                       | `?spec=https://x/openrpc.json` |
| `lang`   | Принудительный язык (`en`/`ru`), переопределяет storage | `?lang=ru`                     |

## Структура проекта

```
src/
├── main.ts                 # bootstrap, обработчики, переключение локали
├── style.css               # все стили (инлайнятся при сборке)
├── types.ts                # типы OpenRPC-документа
├── state.ts                # глобальное состояние (doc, items, drafts, batch, auths)
├── view.ts                 # tiny tagged-template engine (html``, render, escaping)
├── utils.ts                # $, setStatus, refLink, schemaType, summaryDesc
├── api.ts                  # fetchDocument, callRpc, callBatch, example builder
├── i18n/
│   ├── index.ts            # t(), setLocale, applyStaticTranslations, detect
│   ├── en.ts               # базовый словарь (источник истины по ключам)
│   └── ru.ts               # Record<DictKey, string>
└── ui/
    ├── tree.ts             # дерево + поиск
    ├── method.ts           # карточка метода
    ├── type.ts             # карточка типа
    └── playground.ts       # редактор, auth, batch, ответ
```

**Рендеринг.** Вся разметка строится мини-движком шаблонов из `src/view.ts`:
`html\`...\`` возвращает `TemplateResult`, `render(el, ...)` монтирует его.
Интерполяции экранируются автоматически, поэтому UI-модули XSS-безопасны по
построению. Без runtime-зависимостей. Для готового доверенного HTML
(`$ref`-ссылки, pretty JSON) — `raw()`, `json()` или `code()`.

## Как добавить язык

1. Скопируйте `src/i18n/en.ts` в `src/i18n/<code>.ts` и переведите значения.
2. Зарегистрируйте в `src/i18n/index.ts`:

   ```ts
   import { de } from './de';
   const dicts: Record<Locale, Record<DictKey, string>> = { en, ru, de };
   export const LOCALES = [
     { code: 'en', label: 'English' },
     { code: 'ru', label: 'Русский' },
     { code: 'de', label: 'Deutsch' },
   ];
   ```

TypeScript сам сообщит о пропущенных ключах — компилятор как QA перевода.
Подробности — в [CONTRIBUTING.ru.md](CONTRIBUTING.ru.md#переводы).

## Про CORS

И загрузка схемы, и JSON-RPC-вызовы — это браузерные `fetch`. Целевой
сервер должен разрешать cross-origin запросы. Если заполните
*Authorization*, запрос станет preflight (`OPTIONS`), и сервер должен
включать `Authorization` в `Access-Control-Allow-Headers`. UI это обойти не
может — нужен CORS-настроенный сервер, прокси или запуск UI с того же
origin.

## Безопасность

Процесс сообщения об уязвимостях — в [SECURITY.md](SECURITY.md). Утилита
отправляет всё, что вы ввели (параметры, `Authorization`), напрямую на URL
сервера из схемы. **Не используйте production-креды в недоверенной среде.**

## Участие

См. [CONTRIBUTING.ru.md](CONTRIBUTING.ru.md). Участвуя, вы соглашаетесь с
[Кодексом поведения](CODE_OF_CONDUCT.md).

## Лицензия

[MIT](LICENSE)
