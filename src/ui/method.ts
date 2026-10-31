import type { Method, OpenRpcDocument } from '../types';
import { html, json, nothing, render } from '../view';
import { schemaType, summaryDesc } from '../utils';
import { t } from '../i18n';
import { renderPlayground } from './playground';

export function renderMethodDetail(
  contentEl: HTMLElement,
  method: Method,
  doc: OpenRpcDocument,
): void {
  const params = method.params ?? [];

  render(
    contentEl,
    html`
      <div class="card">
        <h2>${method.name}</h2>
        ${method.deprecated
          ? html`<span class="badge" style="background:#fef3c7;color:#b45309;">${t('method.deprecated')}</span>`
          : nothing}

        ${method.summary ? html`<p class="summary">${method.summary}</p>` : nothing}

        ${method.description
          ? method.summary
            ? html`<details class="desc-details"><summary class="muted">${t('method.descDetails')}</summary><p class="subtitle">${method.description}</p></details>`
            : html`<p class="subtitle">${method.description}</p>`
          : nothing}

        <div class="section-title">${t('method.params.title')}</div>
        ${params.length
          ? html`
              <table>
                <thead><tr>
                  <th>${t('method.params.name')}</th>
                  <th>${t('method.params.type')}</th>
                  <th>${t('method.params.required')}</th>
                  <th>${t('method.params.description')}</th>
                </tr></thead>
                <tbody>
                  ${params.map((p) => html`
                    <tr>
                      <td><code>${p.name ?? ''}</code></td>
                      <td>${schemaType(p.schema)}</td>
                      <td>${p.required ? t('method.params.yes') : t('method.params.no')}</td>
                      <td class="muted">${summaryDesc(p.summary, p.description)}</td>
                    </tr>
                  `)}
                </tbody>
              </table>
            `
          : html`<p class="empty-detail">${t('method.params.empty')}</p>`}

        <div class="section-title">${t('method.result.title')}</div>
        ${method.result
          ? html`<p>${schemaType(method.result.schema)}${
              method.result.summary || method.result.description
                ? html` — ${summaryDesc(method.result.summary, method.result.description)}`
                : nothing
            }</p>`
          : html`<p class="empty-detail">${t('method.result.empty')}</p>`}

        ${method.errors && method.errors.length
          ? html`
              <div class="section-title">${t('method.errors.title')}</div>
              <table>
                <thead><tr>
                  <th style="width:100px;">${t('method.errors.code')}</th>
                  <th>${t('method.errors.message')}</th>
                </tr></thead>
                <tbody>
                  ${method.errors.map((e) => html`
                    <tr><td><code>${e.code}</code></td><td>${e.message}</td></tr>
                  `)}
                </tbody>
              </table>
            `
          : nothing}

        ${method.examples && method.examples.length
          ? html`
              <div class="section-title">${t('method.examples.title')}</div>
              ${method.examples.map((ex, i) => {
                const label = ex.summary || ex.name || t('method.examples.label', { n: i + 1 });
                return html`
                  <p class="muted">${label}</p>
                  ${ex.params !== undefined ? html`<pre>${json(ex.params)}</pre>` : nothing}
                  ${ex.result !== undefined
                    ? html`<p class="muted">${t('method.examples.result')}</p><pre>${json(ex.result)}</pre>`
                    : nothing}
                `;
              })}
            `
          : nothing}

        <div class="section-title">${t('method.playground.title')}</div>
        <div id="pgContainer"></div>
      </div>
    `,
  );

  const pgContainer = document.getElementById('pgContainer');
  if (pgContainer) renderPlayground(pgContainer, method, doc);
}
