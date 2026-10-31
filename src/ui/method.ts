import type { Method, OpenRpcDocument } from '../types';
import {
  escapeHtml,
  renderSchemaType,
  renderSummaryAndDescription,
  safeJson,
} from '../utils';
import { t } from '../i18n';
import { renderPlayground } from './playground';

export function renderMethodDetail(
  contentEl: HTMLElement,
  method: Method,
  doc: OpenRpcDocument,
): void {
  const params = method.params ?? [];

  let html = `<div class="card">`;
  html += `<h2>${escapeHtml(method.name)}</h2>`;
  if (method.deprecated) {
    html += `<span class="badge" style="background:#fef3c7;color:#b45309;">${escapeHtml(t('method.deprecated'))}</span>`;
  }

  if (method.summary) {
    html += `<p class="summary">${escapeHtml(method.summary)}</p>`;
  }
  if (method.description) {
    if (method.summary) {
      html += `<details class="desc-details"><summary class="muted">${escapeHtml(t('method.descDetails'))}</summary><p class="subtitle">${escapeHtml(method.description)}</p></details>`;
    } else {
      html += `<p class="subtitle">${escapeHtml(method.description)}</p>`;
    }
  }

  html += `<div class="section-title">${escapeHtml(t('method.params.title'))}</div>`;
  if (params.length) {
    html += `<table><thead><tr>
      <th>${escapeHtml(t('method.params.name'))}</th>
      <th>${escapeHtml(t('method.params.type'))}</th>
      <th>${escapeHtml(t('method.params.required'))}</th>
      <th>${escapeHtml(t('method.params.description'))}</th>
    </tr></thead><tbody>`;
    for (const p of params) {
      const desc = renderSummaryAndDescription(p.summary, p.description);
      const required = p.required ? t('method.params.yes') : t('method.params.no');
      html += `<tr>
        <td><code>${escapeHtml(p.name ?? '')}</code></td>
        <td>${renderSchemaType(p.schema)}</td>
        <td>${escapeHtml(required)}</td>
        <td class="muted">${desc}</td>
      </tr>`;
    }
    html += `</tbody></table>`;
  } else {
    html += `<p class="empty-detail">${escapeHtml(t('method.params.empty'))}</p>`;
  }

  html += `<div class="section-title">${escapeHtml(t('method.result.title'))}</div>`;
  if (method.result) {
    const desc = renderSummaryAndDescription(method.result.summary, method.result.description);
    html += `<p>${renderSchemaType(method.result.schema)}${desc ? ' — ' + desc : ''}</p>`;
  } else {
    html += `<p class="empty-detail">${escapeHtml(t('method.result.empty'))}</p>`;
  }

  if (method.errors && method.errors.length) {
    html += `<div class="section-title">${escapeHtml(t('method.errors.title'))}</div>`;
    html += `<table><thead><tr>
      <th style="width:100px;">${escapeHtml(t('method.errors.code'))}</th>
      <th>${escapeHtml(t('method.errors.message'))}</th>
    </tr></thead><tbody>`;
    for (const e of method.errors) {
      html += `<tr><td><code>${escapeHtml(e.code)}</code></td><td>${escapeHtml(e.message)}</td></tr>`;
    }
    html += `</tbody></table>`;
  }

  if (method.examples && method.examples.length) {
    html += `<div class="section-title">${escapeHtml(t('method.examples.title'))}</div>`;
    method.examples.forEach((ex, i) => {
      const label = ex.summary || ex.name || t('method.examples.label', { n: i + 1 });
      html += `<p class="muted">${escapeHtml(label)}</p>`;
      if (ex.params !== undefined) html += `<pre>${safeJson(ex.params)}</pre>`;
      if (ex.result !== undefined) {
        html += `<p class="muted">${escapeHtml(t('method.examples.result'))}</p><pre>${safeJson(ex.result)}</pre>`;
      }
    });
  }

  html += `<div class="section-title">${escapeHtml(t('method.playground.title'))}</div>`;
  html += `<div id="pgContainer"></div>`;
  html += `</div>`;
  contentEl.innerHTML = html;

  const pgContainer = document.getElementById('pgContainer');
  if (pgContainer) renderPlayground(pgContainer, method, doc);
}