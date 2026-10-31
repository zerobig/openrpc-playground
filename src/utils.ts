import type { Schema } from './types';
import {
  code,
  escapeHtml,
  html,
  nothing,
  raw,
  type SafeHtml,
  type TemplateResult,
} from './view';

export const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element #${id} not found`);
  return el as T;
};

export function setStatus(msg: string, isError = false): void {
  const el = $('status');
  el.textContent = msg || '';
  el.classList.toggle('error', isError);
}

/** `#/components/schemas/X` → clickable link to `type:X` in the tree. */
export function refLink(ref: string): SafeHtml {
  const m = ref.match(/^#\/components\/schemas\/(.+)$/);
  if (m) {
    const name = m[1];
    return raw(
      `<a href="#type:${escapeHtml(name)}" data-ref="type:${escapeHtml(name)}" class="ref-link"><code>${escapeHtml(name)}</code></a>`,
    );
  }
  return code(ref);
}

/** Schema type → `<code>type</code>` or a `$ref` link. */
export function schemaType(schema: Schema | undefined): SafeHtml {
  if (!schema) return raw('—');
  if (schema.$ref) return refLink(schema.$ref);
  if (schema.type) return code(schema.type);
  return raw('—');
}

/** summary + description for a table cell (summary bold, description below). */
export function summaryDesc(
  summary: string | undefined,
  description: string | undefined,
): TemplateResult {
  return html`
    ${summary ? html`<strong>${summary}</strong>` : nothing}
    ${summary && description ? html`<br>` : nothing}
    ${description ?? nothing}
  `;
}
