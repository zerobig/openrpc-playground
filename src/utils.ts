import type { Schema } from './types';

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

export function escapeHtml(str: unknown): string {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function safeJson(value: unknown, indent = 2): string {
  try {
    return escapeHtml(JSON.stringify(value, null, indent));
  } catch {
    return escapeHtml(String(value));
  }
}

/** `#/components/schemas/X` → кликабельная ссылка на type:X. */
export function renderRefLink(ref: string): string {
  const m = ref.match(/^#\/components\/schemas\/(.+)$/);
  if (m) {
    const name = m[1];
    return `<a href="#type:${escapeHtml(name)}" data-ref="type:${escapeHtml(name)}" class="ref-link"><code>${escapeHtml(name)}</code></a>`;
  }
  return `<code>${escapeHtml(ref)}</code>`;
}

/** Универсальный рендер «типа» схемы — учитывает $ref. */
export function renderSchemaType(schema: Schema | undefined): string {
  if (!schema) return '—';
  if (schema.$ref) return renderRefLink(schema.$ref);
  if (schema.type) return `<code>${escapeHtml(schema.type)}</code>`;
  return '—';
}

/** Собрать описание из summary + description для ячейки таблицы. */
export function renderSummaryAndDescription(
  summary: string | undefined,
  description: string | undefined,
): string {
  const parts: string[] = [];
  if (summary) parts.push(`<strong>${escapeHtml(summary)}</strong>`);
  if (description) parts.push(escapeHtml(description));
  return parts.join('<br>');
}