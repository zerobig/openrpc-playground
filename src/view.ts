// Tiny tagged-template engine. Zero deps. Escapes interpolations by default.
//
//   render(el, html`<div class="card">${title}</div>`);
//
// - strings / numbers: escaped
// - null / undefined / false / `nothing`: dropped
// - arrays: flattened
// - nested `html`...``: inlined
// - SafeHtml (via `raw()` / `json()` / `code()`): inserted as-is
// - events: bind after render via querySelector (see UI modules)

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: unknown): string {
  if (value == null) return '';
  return String(value).replace(/[&<>"']/g, (c) => ESCAPE_MAP[c]);
}

/** Marker for trusted raw HTML. Use with care. */
export class SafeHtml {
  constructor(readonly value: string) {}
  toString(): string {
    return this.value;
  }
}

/** Explicit escape hatch for pre-built trusted HTML. */
export const raw = (s: string): SafeHtml => new SafeHtml(s);

/** Sentinel meaning "render nothing" — useful in ternaries. */
export const nothing = Symbol('nothing');

export type Interp =
  | string
  | number
  | boolean
  | null
  | undefined
  | typeof nothing
  | SafeHtml
  | TemplateResult
  | Interp[];

export class TemplateResult {
  constructor(
    readonly strings: TemplateStringsArray,
    readonly values: Interp[],
  ) {}

  toString(): string {
    let out = '';
    for (let i = 0; i < this.strings.length; i++) {
      out += this.strings[i];
      if (i < this.values.length) out += interpToString(this.values[i]);
    }
    return out;
  }
}

function interpToString(v: Interp): string {
  if (v == null || v === false || v === nothing) return '';
  if (v === true) return '';
  if (typeof v === 'string') return escapeHtml(v);
  if (typeof v === 'number') return String(v);
  if (v instanceof SafeHtml) return v.value;
  if (v instanceof TemplateResult) return v.toString();
  if (Array.isArray(v)) return v.map(interpToString).join('');
  return escapeHtml(String(v));
}

export function html(
  strings: TemplateStringsArray,
  ...values: Interp[]
): TemplateResult {
  return new TemplateResult(strings, values);
}

export function render(
  target: HTMLElement,
  tpl: TemplateResult | SafeHtml,
): void {
  target.innerHTML = tpl instanceof SafeHtml ? tpl.value : tpl.toString();
}

/** Pretty JSON, safe inside a `<pre>`. */
export function json(value: unknown, indent = 2): SafeHtml {
  let s: string;
  try {
    s = JSON.stringify(value, null, indent);
  } catch {
    s = String(value);
  }
  return raw(escapeHtml(s));
}

/** Inline `<code>…</code>` with an escaped value. */
export function code(value: unknown): SafeHtml {
  return raw(`<code>${escapeHtml(value)}</code>`);
}
