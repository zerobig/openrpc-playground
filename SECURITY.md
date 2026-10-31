# Security Policy

## Supported Versions

This project is pre-1.0; only the latest release on `main` receives security
fixes.

| Version | Supported          |
| ------- | ------------------ |
| 0.x     | :white_check_mark: |

## Reporting a Vulnerability

**Please do not open a public issue for security problems.**

Report privately via GitHub's
[Security advisories](https://github.com/zerobig/openrpc-playground/security/advisories/new)

Please include:

- A description of the issue and its impact.
- Steps to reproduce, or a minimal proof of concept.
- Affected version/commit.
- Any suggested fix (optional).

You can expect:

- **Acknowledgement** within 3 business days.
- **Initial assessment** within 10 business days.
- **Fix or mitigation** for confirmed issues as soon as practical, coordinated
  with you before public disclosure.
- **Credit** in the advisory, unless you prefer to stay anonymous.

## Scope

This is a browser-only, client-side tool. In-scope security issues typically
involve:

- **XSS** via unescaped user- or schema-supplied strings rendered into the
  DOM.
- **Injection** via URL parameters (`spec`, `lang`) or schema fields that end
  up in `fetch`, `innerHTML`, attributes, etc.
- **Information leakage** — e.g. `Authorization` values being persisted or
  logged where they shouldn't be (drafts are in memory; nothing is sent to a
  third party).
- **Supply-chain** issues in build tooling that affect the shipped
  `dist/index.html`.

## Out of scope

- **CORS errors** — browser policy, not an application vulnerability. If a
  server doesn't allow `Authorization` or cross-origin requests, that's
  expected; use a proxy or serve from the same origin.
- **Missing authentication on the target JSON-RPC server** — not our code.
- **Self-XSS** — you are expected to trust the schema URL you load and the
  server it points to.
- **Vulnerabilities in a third-party JSON-RPC server** you talk to through the
  Playground.

## Handling credentials

The Playground forwards the `Authorization` value you type directly to the
schema's `servers[0].url`. It is stored only in page memory (not
`localStorage`, not sent anywhere else). Still:

- Prefer short-lived tokens.
- Do not load untrusted `spec` URLs while an `Authorization` header is set.
- Close the tab to clear all drafts.
