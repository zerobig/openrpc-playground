import type { Method, OpenRpcDocument } from '../types';
import { escapeHtml, safeJson } from '../utils';
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
    html += `<span class="badge" style="background:#fef3c7;color:#b45309;">deprecated</span>`;
  }
  if (method.description) html += `<p class="subtitle">${escapeHtml(method.description)}</p>`;

  html += `<div class="section-title">Параметры</div>`;
  if (params.length) {
    html += `<table><thead><tr><th>Имя</th><th>Тип</th><th>Обязательный</th><th>Описание</th></tr></thead><tbody>`;
    for (const p of params) {
      const pType = p.schema ? p.schema.type ?? p.schema.$ref ?? '—' : '—';
      html += `<tr>
        <td><code>${escapeHtml(p.name ?? '')}</code></td>
        <td><code>${escapeHtml(pType)}</code></td>
        <td>${p.required ? 'да' : 'нет'}</td>
        <td class="muted">${escapeHtml(p.description ?? '')}</td>
      </tr>`;
    }
    html += `</tbody></table>`;
  } else {
    html += `<p class="empty-detail">Нет параметров.</p>`;
  }

  html += `<div class="section-title">Результат</div>`;
  if (method.result) {
    const rType = method.result.schema
      ? method.result.schema.type ?? method.result.schema.$ref ?? '—'
      : '—';
    html += `<p><code>${escapeHtml(rType)}</code>${
      method.result.description ? ' — ' + escapeHtml(method.result.description) : ''
    }</p>`;
  } else {
    html += `<p class="empty-detail">Не указан.</p>`;
  }

  if (method.examples && method.examples.length) {
    html += `<div class="section-title">Примеры</div>`;
    method.examples.forEach((ex, i) => {
      html += `<p class="muted">Пример ${i + 1}: ${escapeHtml(ex.name ?? '')}</p>`;
      if (ex.params !== undefined) html += `<pre>${safeJson(ex.params)}</pre>`;
      if (ex.result !== undefined) {
        html += `<p class="muted">Результат:</p><pre>${safeJson(ex.result)}</pre>`;
      }
    });
  }

  html += `<div class="section-title">Playground</div>`;
  html += `<div id="pgContainer"></div>`;
  html += `</div>`;
  contentEl.innerHTML = html;

  const pgContainer = document.getElementById('pgContainer');
  if (pgContainer) renderPlayground(pgContainer, method, doc);
}