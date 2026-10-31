import type { Schema } from '../types';
import { html, json, nothing, render } from '../view';
import { schemaType, summaryDesc } from '../utils';
import { t } from '../i18n';

export function renderTypeDetail(contentEl: HTMLElement, name: string, schema: Schema): void {
  const required = new Set(schema.required ?? []);

  render(
    contentEl,
    html`
      <div class="card">
        <h2>${name}</h2>

        ${schema.summary ? html`<p class="summary">${schema.summary}</p>` : nothing}

        ${schema.description
          ? schema.summary
            ? html`<details class="desc-details"><summary class="muted">${t('method.descDetails')}</summary><p class="subtitle">${schema.description}</p></details>`
            : html`<p class="subtitle">${schema.description}</p>`
          : nothing}

        ${schema.type ? html`<p><span class="badge">${schema.type}</span></p>` : nothing}

        ${schema.properties
          ? html`
              <div class="section-title">${t('type.properties.title')}</div>
              <table>
                <thead><tr>
                  <th>${t('type.properties.name')}</th>
                  <th>${t('type.properties.type')}</th>
                  <th>${t('type.properties.description')}</th>
                </tr></thead>
                <tbody>
                  ${Object.entries(schema.properties).map(([propName, propSchema]) => html`
                    <tr>
                      <td><code>${propName}${required.has(propName) ? ' *' : ''}</code></td>
                      <td>${schemaType(propSchema)}</td>
                      <td class="muted">${summaryDesc(propSchema.summary, propSchema.description)}</td>
                    </tr>
                  `)}
                </tbody>
              </table>
            `
          : nothing}

        ${schema.items
          ? html`
              <div class="section-title">${t('type.items.title')}</div>
              <p>${schemaType(schema.items)}</p>
            `
          : nothing}

        ${schema.enum
          ? html`
              <div class="section-title">${t('type.enum.title')}</div>
              <pre>${json(schema.enum)}</pre>
            `
          : nothing}

        <details style="margin-top:16px;">
          <summary class="muted" style="cursor:pointer;font-size:0.85rem;">${t('type.schema.show')}</summary>
          <pre>${json(schema)}</pre>
        </details>
      </div>
    `,
  );
}
