# Contributing to OpenRPC Viewer & Playground

**English** | [Русский](CONTRIBUTING.ru.md)

Thanks for your interest! This project is small and dependency-light on
purpose — please keep that spirit in mind when proposing changes.

By participating, you agree to follow our
[Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- **Bug reports** — use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.yml).
- **Feature requests** — use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.yml).
- **Translations** — improvements to `ru` or new languages are very welcome.
- **Code and docs** — see the workflow below.
- **OpenRPC edge cases** — schema fragments that break the UI are especially
  valuable; attach the smallest JSON that reproduces the issue.

## Development setup

```bash
git clone https://github.com/zerobig/openrpc-playground.git
cd openrpc-playground
npm install
npm run dev
```

Open `http://localhost:5173/?spec=<url-to-openrpc.json>` to auto-load a schema.

| Command         | What it does                                             |
| --------------- | -------------------------------------------------------- |
| `npm run dev`   | Vite dev server with HMR                                 |
| `npm run build` | `tsc` type-check, then `vite build` → `dist/index.html`  |
| `npm run preview` | Serve `dist/` locally                                  |

## Coding guidelines

- **TypeScript strict.** The build runs `tsc` with `noEmit`; a type error
  fails the build. Keep `strict: true`; do not weaken `tsconfig.json` to make
  a change land.
- **No new runtime dependencies** unless justified in the PR. The output is a
  single HTML file — every dependency is inlined.
- **No frameworks.** The UI is plain DOM. If a change needs React/Vue/etc.,
  it belongs in a fork.
- **Rendering.** All HTML is produced by the tagged template `html\`...\`` and
  mounted with `render(el, ...)` from `src/view.ts`. Interpolations are
  auto-escaped, so **do not** call `escapeHtml()` manually and **never** assign
  to `innerHTML`. For pre-built trusted markup (`$ref` links, pretty-printed
  JSON) use `raw()`, `json()`, or `code()` — and nothing else. Schema text is
  untrusted input. Events are bound after `render()` via `querySelector`; keep
  that pattern so DOM nodes stay replaceable.
- **State** lives in `src/state.ts`. Don't introduce module-level `let`
  outside `state.ts` and `i18n/index.ts`.
- **Strings** go through `t('key')` from `src/i18n`. No hard-coded user-facing
  text in UI modules.
- **CSS** — one file (`src/style.css`). Use the existing CSS variables.
- **File layout** — UI in `src/ui/`, rendering engine in `src/view.ts`, network
  in `src/api.ts`, translations in `src/i18n/`.

## Translations

The English dictionary (`src/i18n/en.ts`) is the source of truth.
Every other locale is a `Record<DictKey, string>` — TypeScript enforces
completeness.

### Improve an existing translation

Edit `src/i18n/ru.ts`. Keep placeholders (`{var}`) exactly as in `en.ts`;
do not translate them.

### Add a new language

1. Copy `src/i18n/en.ts` to `src/i18n/<code>.ts`; translate the values.
2. Register in `src/i18n/index.ts`:
   ```ts
   import { de } from './de';
   const dicts: Record<Locale, Record<DictKey, string>> = { en, ru, de };
   export const LOCALES = [/* …, */ { code: 'de', label: 'Deutsch' }];
   ```
   Add `'de'` to the `Locale` union.
3. Build and check that `tsc` is happy (no missing keys).
4. Open a PR titled `feat(i18n): add German`.

If you can only translate part of the dictionary, still open the PR with a
`TODO` comment in untranslated strings — partial translations are welcome.

## Commit messages

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(playground): remember Authorization per method
fix(tree): keep group order stable across locales
docs(readme): document ?lang parameter
i18n(ru): improve batch panel wording
chore(deps): bump vite to 5.2.x
```

The scope matches a top-level area: `ui`, `api`, `i18n`, `build`, `docs`,
`deps`, or the component name (`tree`, `method`, `playground`). Small,
focused commits are easier to review.

## Pull request process

1. Fork, branch off `main` (`feat/…`, `fix/…`, `docs/…`, `i18n/…`).
2. Keep PRs small; one logical change per PR.
3. Run `npm run build` locally — it must pass.
4. Fill in the [PR template](.github/PULL_REQUEST_TEMPLATE.md); link the
   related issue if any.
5. Screenshots (light **and** dark, or with both `?lang=en` and `?lang=ru`)
   are very helpful for UI changes.
6. A maintainer will review; please respond to comments in new commits
   (don't force-push during review unless asked).

## Reporting bugs

Include:

- The `spec` URL (or a **minimal** OpenRPC JSON snippet that reproduces it).
- Browser and OS.
- Steps to reproduce.
- Expected vs. actual.
- The browser console — network and JS errors are extremely helpful.
- If it's a Playground issue, the method name, params JSON (redacted), and
  whether `Authorization` was set.

> Redact tokens, passwords, and internal hostnames before posting.

## Security issues

**Do not** open a public issue. Follow [SECURITY.md](SECURITY.md).

## License

By submitting a contribution you agree that it is licensed under the
[MIT License](LICENSE), the same as the project.
