import type { Schema } from '../types';
import {
  escapeHtml,
  renderSchemaType,
  renderSummaryAndDescription,
  safeJson,
} from '../utils';
import { t } from '../i18n';

export function renderTypeDetail(contentEl: HTMLElement, name: string, schema: Schema): void {
  let html = `<div class="card">`;
  html += `<h2>${escapeHtml(name)}</h2>`;

  if (schema.summary) {
    html += `<p class="summary">${escapeHtml(schema.summary)}</p>`;
  }
  if (schema.description) {
    if (schema.summary) {
      html += `<details class="desc-details"><summary class="muted">${escapeHtml(t('method.descDetails'))}</summary><p class="subtitle">${escapeHtml(schema.description)}</p></details>`;
    } else {
      html += `<p class="subtitle">${escapeHtml(schema.description)}</p>`;
    }
  }
  if (schema.type) html += `<p><span class="badge">${escapeHtml(schema.type)}</span></p>`;

  if (schema.properties) {
    html += `<div class="section-title">${escapeHtml(t('type.properties.title'))}</div>`;
    html += `<table><thead><tr>
      <th>${escapeHtml(t('type.properties.name'))}</th>
      <th>${escapeHtml(t('type.properties.type'))}</th>
      <th>${escapeHtml(t('type.properties.description'))}</th>
    </tr></thead><tbody>`;
    const required = new Set(schema.required ?? []);
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const desc = renderSummaryAndDescription(propSchema.summary, propSchema.description);
      html += `<tr>
        <td><code>${escapeHtml(propName)}${required.has(propName) ? ' *' : ''}</code></td>
        <td>${renderSchemaType(propSchema)}</td>
        <td class="muted">${desc}</td>
      </tr>`;
    }
    html += `</tbody></table>`;
  }

  if (schema.items) {
    html += `<div class="section-title">${escapeHtml(t('type.items.title'))}</div>`;
    html += `<p>${renderSchemaType(schema.items)}</p>`;
  }

  if (schema.enum) {
    html += `<div class="section-title">${escapeHtml(t('type.enum.title'))}</div>`;
    html += `<pre>${safeJson(schema.enum)}</pre>`;
  }

  html += `<details style="margin-top:16px;"><summary class="muted" style="cursor:pointer;font-size:0.85rem;">${escapeHtml(t('type.schema.show'))}</summary><pre>${safeJson(schema)}</pre></details>`;
  html += `</div>`;
  contentEl.innerHTML = html;
}