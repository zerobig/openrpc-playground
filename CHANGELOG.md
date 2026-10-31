# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note on history.** Development has been local so far; the project has not
> been published to a public repository yet, and there are no git tags or
> release pages for earlier versions. Versions below are working milestones
> from that period. Written changelog tracking started with `0.1.0`; `0.2.0`
> predates written records and is documented only in outline.

## [Unreleased]

### Added

- Nothing yet.

## [0.3.0] - 2026-11-01

### Added

- **Multi-source `spec` URL resolution.** The initial schema URL can now come
  from three places (first non-empty wins):
  1. `?spec=<url>` query parameter (unchanged; useful for debugging / sharing),
  2. `window.OPENRPC_SPEC_URL` global (set via a `<script>` before the module
     script),
  3. `<meta name="openrpc-spec-url" content="<url>">` in the document head.

  This makes it possible to ship a pre-built `dist/index.html` with a baked-in
  schema URL for embedding scenarios, while still allowing a query override.

### Changed

- **Internal:** all UI rendering moved to a tiny zero-dependency tagged-template
  engine (`src/view.ts`): `html\`...\`` returns a `TemplateResult`,
  `render(el, ...)` mounts it, interpolations are auto-escaped. No behavior
  change; markup code is shorter and XSS-safe by construction.
- **Build:** inlined `<style>` no longer carries `rel="stylesheet"` /
  `crossorigin` (HTML validity). A small post-processing Vite plugin
  (`cleanupSingleFileHtml`) cleans the single-file output.
- **DX:** `tsconfig.json` now includes `"types": ["vite/client"]`, so
  `import './style.css'` is no longer reported as an error by the editor.

### Fixed

- Single-file build no longer emits invalid attributes on inlined `<style>`.

## [0.2.0]

> Local milestone released before written changelog tracking. Contents are not
> catalogued here; if you can reconstruct them, extend this section
> retroactively. Broadly: the initial viewer + playground baseline that
> `0.3.0` builds on top of.
> 
## [0.1.0] - 2025-10-31

### Added

- Initial public release.
- OpenRPC 1.x schema loading by URL (or `?spec=<url>`).
- Sidebar tree of methods and types, grouped by namespace, with search across
  names, `summary`, and `description`.
- Method detail view: parameters (with clickable `$ref` links), result,
  pre-declared errors, examples.
- Playground: editable JSON params, single JSON-RPC 2.0 call with HTTP status,
  timing, and pretty-printed response body.
- Batch mode: queue calls across methods, send a single JSON-RPC batch to the
  server of the first queued item.
- Optional `Authorization` header per method.
- `summary` rendered always; long `description` collapsed into `<details>`.
- i18n: English (default) and Russian, switchable in the header, persisted in
  `localStorage`, overridable with `?lang=en|ru`.
- Single-file build via `vite-plugin-singlefile` → `dist/index.html`.
