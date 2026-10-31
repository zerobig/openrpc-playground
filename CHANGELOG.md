# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Internal:** all UI rendering now uses a tiny zero-dependency tagged-template
  engine (`src/view.ts`): `html\`...\`` templates, auto-escaping, `render()`.
  No behavior change; markup code became shorter and XSS-safe by construction.
  
## [0.1.0] - 2026-10-31

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

[Unreleased]: https://github.com/zerobig/openrpc-playground/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/zerobig/openrpc-playground/releases/tag/v0.1.0
