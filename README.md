# OpenRPC Viewer & Playground

**English** | [Русский](README.ru.md)

[![CI](https://github.com/zerobig/openrpc-playground/actions/workflows/ci.yml/badge.svg)](https://github.com/zerobig/openrpc-playground/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](tsconfig.json)

A standalone, browser-based viewer and playground for
[OpenRPC](https://spec.open-rpc.org/) schemas. Load a schema by URL, browse
methods and types, inspect parameters and errors, and send JSON-RPC 2.0
requests — including batches — all without a backend.

Built with TypeScript + Vite and shipped as a **single `index.html`** file via
[`vite-plugin-singlefile`](https://github.com/richardtallent/vite-plugin-singlefile).
Drop it on any static host, attach it to a ticket, or open it from disk.

## Why this exists

There is no sane, self-contained way to browse an OpenRPC schema and fire
JSON-RPC requests against it without pulling in a framework, a CLI, or a full
API client. Existing tools either assume OpenAPI/REST, require an account, or
need a backend. This project is the smallest thing that solves exactly that:
one HTML file, zero runtime dependencies, works offline.

## Features

- **URL-based schema loading** — point it at any `openrpc.json`, no uploads.
- **Method and type browser** — grouped by namespace, with search across
  names, `summary`, and `description`.
- **`summary` and `description`** — short summary always visible, long
  description collapsed into a `<details>` block.
- **`$ref` navigation** — `#/components/schemas/Foo` becomes a clickable link
  that jumps to `type:Foo` in the tree.
- **Playground** — editable JSON params, send single JSON-RPC 2.0 calls, see
  HTTP status, timing, and the response body (pretty-printed JSON).
- **Batch requests** — queue multiple calls across methods and send one
  JSON-RPC batch. Target server is shown explicitly.
- **Authorization header** — optional per-method `Authorization` value
  (e.g. `Basic …`, `Bearer …`) forwarded with `fetch`.
- **Pre-declared errors** — `method.errors` rendered as a table before you
  send anything.
- **i18n** — English (default) and Russian, switchable in the header.
  `?lang=en|ru` overrides storage; `?spec=<url>` auto-loads a schema.
- **No tracking, no backend** — everything runs locally in the browser.

## Used by

- [zerobig/swagger-1c](https://github.com/zerobig/swagger-1c) — 1C:Enterprise
  tooling that embeds this viewer. Independent project; issues with this
  viewer belong here, not there.

## Quick start

### Use the prebuilt single-file version

Grab the latest `dist/index.html` from
[Releases](https://github.com/zerobig/openrpc-playground/releases) and open it
in any modern browser:

```
file:///path/to/index.html?spec=https://example.com/openrpc.json
```

> **CORS warning.** When opened via `file://`, cross-origin `fetch` to the
> schema URL and to the JSON-RPC server may be blocked by the browser. For
> local use, serve the `dist/` folder via any static server:
>
> ```bash
> npx serve dist
> # or
> python -m http.server -d dist
> ```

### Build from source

Requires Node.js 18+ (see `.nvmrc`).

```bash
git clone https://github.com/zerobig/openrpc-playground.git
cd openrpc-playground
npm install
npm run build
# → dist/index.html
```

## Development

```bash
npm run dev
```

Starts a Vite dev server with HMR at `http://localhost:5173`. Pass URL params
directly:

```
http://localhost:5173/?spec=https://example.com/openrpc.json&lang=ru
```

`npm run build` runs `tsc` first (type-check, `noEmit`) and then
`vite build`. A type error fails the build.

## Usage

1. **Load a schema** — paste an OpenRPC JSON URL into the header and press
   *Load* (or hit `Enter`). Alternatively append `?spec=<url>` to the page URL.
2. **Browse** — methods are grouped by their namespace prefix
   (`Products.Get` → group `Products`). Types live under *Types*. Use the
   search box to filter.
3. **Read the method** — summary, description, params (with `$ref` links),
   result, possible errors, examples.
4. **Try it** — edit the JSON in *Playground*, optionally fill
   *Authorization*, click *Send* (or `Ctrl/Cmd + Enter`). Response appears
   below with status, timing, and body.
5. **Batch** — click *+ To batch* for several methods (across different
   methods is fine), then *Send batch*. The batch goes to the server of the
   **first** queued item; the target server is shown in the batch header.
6. **Language** — switch EN/RU in the header. Preference is persisted in
   `localStorage`.

## URL parameters

| Param  | Effect                                              | Example                          |
| ------ | --------------------------------------------------- | -------------------------------- |
| `spec` | Auto-load an OpenRPC schema from this URL (see below) | `?spec=https://x/openrpc.json` |
| `lang` | Force UI language (`en` or `ru`), overrides storage | `?lang=ru`                       |

### Spec URL resolution

On startup, the schema URL is resolved from the first non-empty source:

1. `?spec=<url>` query parameter.
2. `window.OPENRPC_SPEC_URL` global — set via a `<script>` before the module
   script.
3. `<meta name="openrpc-spec-url" content="<url>">` in the document `<head>`.

This is convenient for embedding: you can build `dist/index.html` once and
ship it with a baked-in schema URL, while still allowing `?spec=` as a runtime
override. Example:

```html
<!-- Option A: meta tag -->
<meta name="openrpc-spec-url" content="https://example.com/openrpc.json">

<!-- Option B: global before the bundle -->
<script>window.OPENRPC_SPEC_URL = 'https://example.com/openrpc.json';</script>
```

## Project structure

```
src/
├── main.ts                 # bootstrap, event wiring, locale switching
├── style.css               # all styles (inlined at build)
├── types.ts                # OpenRPC document typings
├── state.ts                # global state (doc, items, drafts, batch, auths)
├── view.ts                 # tiny tagged-template engine (html``, render, escaping)
├── utils.ts                # $, setStatus, refLink, schemaType, summaryDesc
├── api.ts                  # fetchDocument, callRpc, callBatch, example builder
├── i18n/
│   ├── index.ts            # t(), setLocale, applyStaticTranslations, locale detect
│   ├── en.ts               # base dictionary (source of truth for keys)
│   └── ru.ts               # Record<DictKey, string>
└── ui/
    ├── tree.ts             # left sidebar tree + search
    ├── method.ts           # method detail card
    ├── type.ts             # type detail card
    └── playground.ts       # editor, auth header, batch panel, response
```

**Rendering.** All markup is produced by a tiny tagged-template engine in
`src/view.ts`: `html\`...\`` returns a `TemplateResult`, `render(el, ...)`
mounts it. Interpolations are auto-escaped, so UI modules are XSS-safe by
construction. No runtime dependencies. For pre-built trusted markup (`$ref`
links, pretty JSON) use `raw()`, `json()`, or `code()`.

## Adding a language

1. Copy `src/i18n/en.ts` to `src/i18n/<code>.ts` and translate values.
2. Register it in `src/i18n/index.ts`:

   ```ts
   import { de } from './de';
   const dicts: Record<Locale, Record<DictKey, string>> = { en, ru, de };
   export const LOCALES = [
     { code: 'en', label: 'English' },
     { code: 'ru', label: 'Русский' },
     { code: 'de', label: 'Deutsch' },
   ];
   ```

TypeScript will complain about any missing key — the compiler is your
translation QA. See [CONTRIBUTING.md](CONTRIBUTING.md#translations) for
details.

## CORS note

Both the schema fetch and the JSON-RPC calls are browser `fetch` requests.
The target server must permit cross-origin requests (and, if you fill
*Authorization*, include `Authorization` in `Access-Control-Allow-Headers` —
which turns the request into a preflighted `OPTIONS`). The UI cannot work
around this; use a CORS-enabled server, a proxy, or serve the app from the
same origin.

## Security

See [SECURITY.md](SECURITY.md) for the vulnerability reporting process.
This tool sends whatever you type (params, `Authorization`) directly to the
server URL in the schema. **Do not use it with production credentials in
untrusted environments.**

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). By participating, you agree to the
[Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)
