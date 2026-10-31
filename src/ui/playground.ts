import type { Method, OpenRpcDocument } from '../types';
import { state } from '../state';
import { $ } from '../utils';
import { html, nothing, raw, render, type SafeHtml, type TemplateResult } from '../view';
import {
  buildExampleParams,
  callBatch,
  callRpc,
  getDefaultServerUrl,
  type RpcCallResult,
} from '../api';
import { t } from '../i18n';

let nextBatchId = 1;

export function renderPlayground(
  container: HTMLElement,
  method: Method,
  doc: OpenRpcDocument,
): void {
  const servers = doc.servers ?? [];
  const defaultUrl = getDefaultServerUrl(doc);
  const savedUrl = state.servers.get(method.name);
  const selectedUrl = savedUrl ?? defaultUrl ?? '';
  const auth = state.auths.get(method.name) ?? '';
  const byName = method.paramStructure === 'by-name';
  const draft = state.drafts.get(method.name);
  const paramsText = draft ?? JSON.stringify(buildExampleParams(method), null, 2);
  const labelKey = byName ? 'pg.params.labelByName' : 'pg.params.labelByPosition';

  render(
    container,
    html`
      ${servers.length > 1
        ? html`
            <div class="pg-row">
              <label for="pgServer">${t('pg.server')}</label>
              <select id="pgServer">
                ${servers.map((s) => {
                  const u = (s.url || '').replace(/\/+$/, '');
                  const label = (s.name ? s.name + ' — ' : '') + u;
                  return html`<option value="${u}" ${u === selectedUrl ? raw('selected') : nothing}>${label}</option>`;
                })}
              </select>
            </div>
          `
        : !defaultUrl
          ? html`<p class="empty-detail">${t('pg.noServer')}</p>`
          : nothing}

      <label class="muted" style="font-size:0.85rem;display:block;margin-bottom:4px;">${t(labelKey)}</label>
      <textarea id="pgParams" class="pg-editor" spellcheck="false">${paramsText}</textarea>

      <div class="pg-actions">
        <button id="pgSend" class="btn btn-primary">${t('pg.send')}</button>
        <button id="pgAddBatch" class="btn">${t('pg.addToBatch')}</button>
        <button id="pgReset" class="btn">${t('pg.reset')}</button>
        <span class="pg-spacer"></span>
        <span id="pgHint" class="muted" style="font-size:0.8rem;"></span>
      </div>

      <div class="pg-row" style="margin-top:8px;">
        <label for="pgAuth">${t('pg.auth.label')}</label>
        <input id="pgAuth" type="text" class="pg-auth"
          placeholder="${t('pg.auth.placeholder')}"
          value="${auth}" autocomplete="off" spellcheck="false" />
      </div>

      <div id="batchContainer"></div>

      <div class="pg-response" id="pgResponse">
        <div class="pg-response-head"><span class="muted">${t('pg.response.placeholder')}</span></div>
      </div>
    `,
  );

  bindPlayground(method, selectedUrl);
  updateBatchPanel();
}

function bindPlayground(method: Method, initialUrl: string): void {
  const pgParams = $<HTMLTextAreaElement>('pgParams');
  const pgSend = $<HTMLButtonElement>('pgSend');
  const pgAddBatch = $<HTMLButtonElement>('pgAddBatch');
  const pgReset = $<HTMLButtonElement>('pgReset');
  const pgHint = $<HTMLSpanElement>('pgHint');
  const pgAuth = $<HTMLInputElement>('pgAuth');
  const pgServer = document.getElementById('pgServer') as HTMLSelectElement | null;

  let currentUrl = initialUrl;

  pgParams.addEventListener('input', () => {
    state.drafts.set(method.name, pgParams.value);
    try {
      JSON.parse(pgParams.value || 'null');
      pgParams.classList.remove('invalid');
      pgHint.textContent = '';
    } catch {
      pgParams.classList.add('invalid');
      pgHint.textContent = t('pg.invalidJson');
    }
  });

  pgAuth.addEventListener('input', () => {
    state.auths.set(method.name, pgAuth.value);
  });

  if (pgServer) {
    currentUrl = pgServer.value;
    pgServer.addEventListener('change', () => {
      currentUrl = pgServer.value;
      state.servers.set(method.name, currentUrl);
    });
  }

  pgReset.addEventListener('click', () => {
    const fresh = JSON.stringify(buildExampleParams(method), null, 2);
    pgParams.value = fresh;
    state.drafts.set(method.name, fresh);
    pgParams.classList.remove('invalid');
    pgHint.textContent = '';
  });

  const readParams = (): { ok: true; params: unknown } | { ok: false; error: string } => {
    try {
      const rawText = (pgParams.value || '').trim();
      const params =
        rawText === '' ? (method.paramStructure === 'by-name' ? {} : []) : JSON.parse(rawText);
      return { ok: true, params };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  };

  const send = async (): Promise<void> => {
    if (!currentUrl) {
      const box = document.getElementById('pgResponse');
      if (box) showError(box, t('pg.error.noServer'));
      return;
    }
    const parsed = readParams();
    if (!parsed.ok) {
      const box = document.getElementById('pgResponse');
      if (box) showError(box, t('pg.error.invalidParams', { message: parsed.error }));
      return;
    }

    pgSend.disabled = true;
    const orig = pgSend.textContent ?? t('pg.send');
    pgSend.textContent = t('pg.sending');
    try {
      const result = await callRpc(currentUrl, method, parsed.params, state.auths.get(method.name));
      // Re-lookup in case the DOM was re-rendered (e.g. locale switched mid-flight).
      const box = document.getElementById('pgResponse');
      if (box) renderResponse(box, result, currentUrl);
    } finally {
      const freshSend = document.getElementById('pgSend') as HTMLButtonElement | null;
      if (freshSend) {
        freshSend.disabled = false;
        freshSend.textContent = t('pg.send');
      } else {
        pgSend.disabled = false;
        pgSend.textContent = orig;
      }
    }
  };

  pgAddBatch.addEventListener('click', () => {
    const parsed = readParams();
    if (!parsed.ok) {
      const box = document.getElementById('pgResponse');
      if (box) showError(box, t('pg.error.invalidParams', { message: parsed.error }));
      return;
    }
    state.batch.push({
      id: nextBatchId++,
      methodName: method.name,
      params: parsed.params,
      serverUrl: currentUrl,
      auth: state.auths.get(method.name) ?? '',
    });
    updateBatchPanel();
  });

  pgSend.addEventListener('click', () => void send());
  pgParams.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      void send();
    }
  });
}

function updateBatchPanel(): void {
  const container = document.getElementById('batchContainer');
  if (!container) return;

  if (!state.batch.length) {
    container.innerHTML = '';
    return;
  }

  const targetServer = state.batch[0].serverUrl || '—';
  render(
    container,
    html`
      <div class="batch-panel">
        <div class="batch-head">
          <strong>${t('pg.batch.title', { n: state.batch.length })}</strong>
          <span class="muted" style="font-family:monospace;font-size:0.78rem;">${t('pg.batch.targetServer')} ${targetServer}</span>
          <span class="pg-spacer"></span>
          <button id="pgBatchSend" class="btn btn-primary" style="padding:4px 12px;font-size:0.8rem;">${t('pg.batch.send')}</button>
          <button id="pgBatchClear" class="btn" style="padding:4px 12px;font-size:0.8rem;">${t('pg.batch.clear')}</button>
        </div>
        <ul class="batch-list">
          ${state.batch.map((item) => html`
            <li>
              <code>${item.methodName}</code>
              <span class="muted">#${item.id}</span>
              <span class="batch-params">${JSON.stringify(item.params)}</span>
              <button class="batch-remove" data-batch-id="${item.id}" title="${t('pg.batch.remove')}">×</button>
            </li>
          `)}
        </ul>
      </div>
    `,
  );
  bindBatchPanel(container);
}

function bindBatchPanel(container: HTMLElement): void {
  const sendBtn = container.querySelector<HTMLButtonElement>('#pgBatchSend');
  const clearBtn = container.querySelector<HTMLButtonElement>('#pgBatchClear');

  container.querySelectorAll<HTMLElement>('.batch-remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.batchId);
      state.batch = state.batch.filter((it) => it.id !== id);
      updateBatchPanel();
    });
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      state.batch = [];
      updateBatchPanel();
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
      if (!state.batch.length) return;
      const first = state.batch[0];
      if (!first.serverUrl) {
        const box = document.getElementById('pgResponse');
        if (box) showError(box, t('pg.batch.noServer'));
        return;
      }
      sendBtn.disabled = true;
      const orig = sendBtn.textContent ?? t('pg.batch.send');
      sendBtn.textContent = t('pg.batch.sending');
      try {
        const result = await callBatch(first.serverUrl, state.batch, first.auth);
        const box = document.getElementById('pgResponse');
        if (box) renderResponse(box, result, first.serverUrl);
      } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = orig;
      }
    });
  }
}

function showError(box: HTMLElement, message: string): void {
  render(
    box,
    html`
      <div class="pg-response-head"><span class="pg-status err">${t('pg.error.title')}</span></div>
      <div class="pg-empty">${message}</div>
    `,
  );
}

function renderResponse(box: HTMLElement, r: RpcCallResult, url: string): void {
  let cls: 'ok' | 'warn' | 'err' = 'ok';
  let statusLabel: string;

  if (r.networkError) {
    cls = 'err';
    statusLabel = t('pg.status.networkError', { ms: r.ms });
  } else if (!r.ok) {
    cls = 'err';
    statusLabel = t('pg.status.http', { status: r.status, statusText: r.statusText, ms: r.ms });
  } else if (r.rpcError) {
    cls = 'warn';
    statusLabel = t('pg.status.rpcError', { status: r.status, ms: r.ms });
  } else {
    statusLabel = t('pg.status.http', { status: r.status, statusText: r.statusText, ms: r.ms });
  }

  let body: TemplateResult | SafeHtml;
  if (r.networkError) {
    body = html`<pre>${t('pg.network.message', { url, error: r.networkError })}</pre>`;
  } else if (r.bodyPretty) {
    body = html`<pre>${r.bodyPretty}</pre>`;
  } else {
    body = html`<div class="pg-empty">${t('pg.response.empty')}</div>`;
  }

  render(
    box,
    html`
      <div class="pg-response-head">
        <span class="pg-status ${cls}">${statusLabel}</span>
        <span class="pg-spacer"></span>
        <button class="btn" id="pgCopyResp" style="padding:4px 10px;font-size:0.75rem;">${t('pg.response.copy')}</button>
      </div>
      ${body}
    `,
  );

  const copyBtn = document.getElementById('pgCopyResp') as HTMLButtonElement | null;
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(r.bodyText || '').then(() => {
        copyBtn.textContent = t('pg.response.copied');
        setTimeout(() => (copyBtn.textContent = t('pg.response.copy')), 1500);
      });
    });
  }
}
