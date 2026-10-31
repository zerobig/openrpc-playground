import type { Method, OpenRpcDocument } from '../types';
import { state } from '../state';
import { escapeHtml, $ } from '../utils';
import {
  buildExampleParams,
  callRpc,
  getDefaultServerUrl,
  type RpcCallResult,
} from '../api';

export function renderPlayground(
  container: HTMLElement,
  method: Method,
  doc: OpenRpcDocument,
): void {
  const servers = doc.servers ?? [];
  const defaultUrl = getDefaultServerUrl(doc);
  const savedUrl = state.servers.get(method.name);
  const selectedUrl = savedUrl ?? defaultUrl ?? '';

  let html = '';

  if (servers.length > 1) {
    html += `<div class="pg-row"><label for="pgServer">Сервер:</label><select id="pgServer">`;
    for (const s of servers) {
      const u = (s.url || '').replace(/\/+$/, '');
      const label = (s.name ? s.name + ' — ' : '') + u;
      html += `<option value="${escapeHtml(u)}"${u === selectedUrl ? ' selected' : ''}>${escapeHtml(label)}</option>`;
    }
    html += `</select></div>`;
  } else if (!defaultUrl) {
    html += `<p class="empty-detail">В схеме нет <code>servers[].url</code>. Playground не сможет отправить запрос.</p>`;
  }

  const draft = state.drafts.get(method.name);
  const paramsText = draft ?? JSON.stringify(buildExampleParams(method), null, 2);
  const byName = method.paramStructure === 'by-name';

  html += `<label class="muted" style="font-size:0.85rem;display:block;margin-bottom:4px;">Параметры (JSON, ${byName ? 'объект' : 'массив'})</label>`;
  html += `<textarea id="pgParams" class="pg-editor" spellcheck="false">${escapeHtml(paramsText)}</textarea>`;

  html += `<div class="pg-actions">
    <button id="pgSend" class="btn btn-primary">Отправить</button>
    <button id="pgReset" class="btn">Сбросить</button>
    <span class="pg-spacer"></span>
    <span id="pgHint" class="muted" style="font-size:0.8rem;"></span>
  </div>`;

  html += `<div class="pg-response" id="pgResponse">
    <div class="pg-response-head"><span class="muted">Ответ появится здесь после отправки.</span></div>
  </div>`;

  container.innerHTML = html;

  bindPlayground(method, selectedUrl);
}

function bindPlayground(method: Method, initialUrl: string): void {
  const pgParams = $<HTMLTextAreaElement>('pgParams');
  const pgSend = $<HTMLButtonElement>('pgSend');
  const pgReset = $<HTMLButtonElement>('pgReset');
  const pgHint = $<HTMLSpanElement>('pgHint');
  const responseBox = $<HTMLDivElement>('pgResponse');
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
      pgHint.textContent = '⚠ JSON невалиден';
    }
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

  const send = async (): Promise<void> => {
    if (!currentUrl) {
      showError(responseBox, 'Нет URL сервера в схеме');
      return;
    }

    let params: unknown;
    try {
      const raw = (pgParams.value || '').trim();
      params = raw === ''
        ? (method.paramStructure === 'by-name' ? {} : [])
        : JSON.parse(raw);
    } catch (e) {
      showError(responseBox, 'Невалидный JSON в параметрах: ' + (e as Error).message);
      return;
    }

    pgSend.disabled = true;
    const orig = pgSend.textContent;
    pgSend.textContent = 'Отправка…';
    try {
      const result = await callRpc(currentUrl, method, params);
      renderResponse(responseBox, result, currentUrl);
    } finally {
      pgSend.disabled = false;
      pgSend.textContent = orig;
    }
  };

  pgSend.addEventListener('click', () => void send());
  pgParams.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      void send();
    }
  });
}

function showError(box: HTMLElement, message: string): void {
  box.innerHTML = `<div class="pg-response-head"><span class="pg-status err">Ошибка</span></div>
    <div class="pg-empty">${escapeHtml(message)}</div>`;
}

function renderResponse(box: HTMLElement, r: RpcCallResult, url: string): void {
  let cls: 'ok' | 'warn' | 'err' = 'ok';
  let statusLabel: string;

  if (r.networkError) {
    cls = 'err';
    statusLabel = `Сетевая ошибка · ${r.ms} ms`;
  } else if (!r.ok) {
    cls = 'err';
    statusLabel = `HTTP ${r.status} ${r.statusText} · ${r.ms} ms`;
  } else if (r.rpcError) {
    cls = 'warn';
    statusLabel = `HTTP ${r.status} · JSON-RPC error · ${r.ms} ms`;
  } else {
    statusLabel = `HTTP ${r.status} ${r.statusText} · ${r.ms} ms`;
  }

  let bodyHtml: string;
  if (r.networkError) {
    bodyHtml = `<pre>${escapeHtml(
      `Не удалось выполнить запрос к ${url}\n\n${r.networkError}\n\n` +
        `Возможные причины:\n• сервер недоступен\n• CORS запрещает запрос из браузера\n• неверная схема URL`,
    )}</pre>`;
  } else if (r.bodyPretty) {
    bodyHtml = `<pre>${escapeHtml(r.bodyPretty)}</pre>`;
  } else {
    bodyHtml = `<div class="pg-empty">Пустой ответ.</div>`;
  }

  box.innerHTML = `<div class="pg-response-head">
    <span class="pg-status ${cls}">${escapeHtml(statusLabel)}</span>
    <span class="pg-spacer"></span>
    <button class="btn" id="pgCopyResp" style="padding:4px 10px;font-size:0.75rem;">Копировать</button>
  </div>${bodyHtml}`;

  const copyBtn = document.getElementById('pgCopyResp') as HTMLButtonElement | null;
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(r.bodyText || '').then(() => {
        copyBtn.textContent = 'Скопировано!';
        setTimeout(() => (copyBtn.textContent = 'Копировать'), 1500);
      });
    });
  }
}