import './style.css';
import type { OpenRpcDocument } from './types';
import { state, type FlatItem } from './state';
import { $, setStatus } from './utils';
import { html, render } from './view';
import { fetchDocument } from './api';
import { renderTree } from './ui/tree';
import { renderMethodDetail } from './ui/method';
import { renderTypeDetail } from './ui/type';
import {
  applyStaticTranslations,
  getLocale,
  LOCALES,
  onLocaleChange,
  setLocale,
  t,
  type Locale,
} from './i18n';

const urlInput = $<HTMLInputElement>('urlInput');
const loadBtn = $<HTMLButtonElement>('loadUrlBtn');
const searchInput = $<HTMLInputElement>('searchInput');
const treeEl = $<HTMLDivElement>('tree');
const contentEl = $<HTMLElement>('content');
const langSwitcher = $<HTMLSelectElement>('langSwitcher');

const TYPES_GROUP = '__types__';

function buildFlatItems(doc: OpenRpcDocument): FlatItem[] {
  const items: FlatItem[] = [];
  for (const m of doc.methods ?? []) {
    const group = m.name.includes('.') ? m.name.split('.')[0] : 'default';
    items.push({ id: 'method:' + m.name, kind: 'method', name: m.name, group, data: m });
  }
  const schemas = doc.components?.schemas ?? {};
  for (const typeName of Object.keys(schemas)) {
    items.push({
      id: 'type:' + typeName,
      kind: 'type',
      name: typeName,
      group: TYPES_GROUP,
      data: schemas[typeName],
    });
  }
  return items;
}

function refreshTree(): void {
  renderTree(treeEl, {
    items: state.items,
    filter: searchInput.value,
    activeId: state.activeId,
    onSelect: selectItem,
  });
}

function selectItem(id: string): void {
  state.activeId = id;
  treeEl.querySelectorAll<HTMLElement>('.tree-item').forEach((el) => {
    el.classList.toggle('active', el.dataset.id === id);
  });
  const item = state.items.find((it) => it.id === id);
  if (!item || !state.doc) return;
  if (item.kind === 'method') {
    renderMethodDetail(contentEl, item.data, state.doc);
  } else {
    renderTypeDetail(contentEl, item.name, item.data);
  }
  const activeEl = treeEl.querySelector<HTMLElement>('.tree-item.active');
  if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
}

function renderLoadedNoMethods(): void {
  render(
    contentEl,
    html`
      <div class="placeholder">
        <h2>${t('placeholder.loadedNoMethods.title')}</h2>
        <p>${t('placeholder.loadedNoMethods.text')}</p>
      </div>
    `,
  );
}

function loadDoc(doc: OpenRpcDocument): void {
  state.doc = doc;
  state.items = buildFlatItems(doc);
  state.activeId = null;
  state.drafts.clear();
  state.servers.clear();
  state.auths.clear();
  state.batch = [];

  const methodCount = doc.methods?.length ?? 0;
  const typeCount = Object.keys(doc.components?.schemas ?? {}).length;
  setStatus(
    t('status.loaded', {
      title: doc.info?.title ?? 'OpenRPC',
      methods: methodCount,
      types: typeCount,
    }),
  );

  refreshTree();

  const firstMethod = state.items.find((it) => it.kind === 'method');
  if (firstMethod) {
    selectItem(firstMethod.id);
  } else {
    renderLoadedNoMethods();
  }
}

async function loadFromUrl(url: string): Promise<void> {
  if (!url) {
    setStatus(t('status.emptyUrl'), true);
    return;
  }
  setStatus(t('status.loading'));
  try {
    const doc = await fetchDocument(url);
    loadDoc(doc);
  } catch (err) {
    setStatus(t('status.error', { message: (err as Error).message }), true);
  }
}

// ---------- инициализация i18n ----------
applyStaticTranslations();
render(
  langSwitcher,
  html`${LOCALES.map((l) => html`<option value="${l.code}">${l.label}</option>`)}`,
);
langSwitcher.value = getLocale();
langSwitcher.addEventListener('change', () => {
  setLocale(langSwitcher.value as Locale);
});

onLocaleChange((locale) => {
  langSwitcher.value = locale;
  if (state.doc) {
    refreshTree();
    if (state.activeId) selectItem(state.activeId);
    else renderLoadedNoMethods();
  }
  // Если doc ещё не загружен — статику уже обновил applyStaticTranslations.
});

// ---------- обработчики ----------
loadBtn.addEventListener('click', () => void loadFromUrl(urlInput.value.trim()));
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') void loadFromUrl(urlInput.value.trim());
});
searchInput.addEventListener('input', refreshTree);

contentEl.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const refEl = target.closest<HTMLElement>('[data-ref]');
  if (refEl) {
    e.preventDefault();
    const id = refEl.dataset.ref;
    if (id) selectItem(id);
  }
});

function resolveSpecUrl(): string | null {
  // 1. Query parameter
  const fromQuery = new URLSearchParams(location.search).get('spec');
  if (fromQuery && fromQuery.trim()) {
    return fromQuery.trim();
  }

  // 2. Global variable (typed access)
  const globalUrl = (window as Window & { OPENRPC_SPEC_URL?: string }).OPENRPC_SPEC_URL;
  if (typeof globalUrl === 'string' && globalUrl.trim()) {
    return globalUrl.trim();
  }

  // 3. Meta tag (typed access)
  const meta = document.querySelector<HTMLMetaElement>('meta[name="openrpc-spec-url"]');
  if (meta?.content?.trim()) {
    return meta.content.trim();
  }

  return null;
}

const specUrl = resolveSpecUrl();
if (specUrl) {
  urlInput.value = specUrl;
  void loadFromUrl(specUrl);
}
