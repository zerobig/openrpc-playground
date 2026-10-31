import type { Schema } from '../types';
import { escapeHtml, safeJson } from '../utils';

export function renderTypeDetail(contentEl: HTMLElement, name: string, schema: Schema): void {
  let html = `<div class="card">`;
  html += `<h2>${escapeHtml(name)}</h2>`;
  if (schema.description) html += `<p class="subtitle">${escapeHtml(schema.description)}</p>`;
  if (schema.type) html += `<p><span class="badge">${escapeHtml(schema.type)}</span></p>`;

  if (schema.properties) {
    html += `<div class="section-title">Свойства</div>`;
    html += `<table><thead><tr><th>Имя</th><th>Тип</th><th>Описание</th></tr></thead><tbody>`;
    const required = new Set(schema.required ?? []);
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const pType = propSchema.type ?? propSchema.$ref ?? '—';
      html += `<tr>
        <td><code>${escapeHtml(propName)}${required.has(propName) ? ' *' : ''}</code></td>
        <td><code>${escapeHtml(pType)}</code></td>
        <td class="muted">${escapeHtml(propSchema.description ?? '')}</td>
      </tr>`;
    }
    html += `</tbody></table>`;
  }

  if (schema.items) {
    html += `<div class="section-title">Элементы массива</div>`;
    html += `<p><code>${escapeHtml(schema.items.type ?? schema.items.$ref ?? '—')}</code></p>`;
  }

  if (schema.enum) {
    html += `<div class="section-title">Допустимые значения</div>`;
    html += `<pre>${safeJson(schema.enum)}</pre>`;
  }

  html += `<details style="margin-top:16px;"><summary class="muted" style="cursor:pointer;font-size:0.85rem;">Показать JSON-схему</summary><pre>${safeJson(schema)}</pre></details>`;
  html += `</div>`;
  contentEl.innerHTML = html;
}