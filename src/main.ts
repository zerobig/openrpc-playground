import './style.css';
import type { OpenRpcDocument } from './types';
import { state, type FlatItem } from './state';
import { $, setStatus } from './utils';
import { fetchDocument } from './api';
import { renderTree } from './ui/tree';
import { renderMethodDetail } from './ui/method';
import { renderTypeDetail } from './ui/type';

const urlInput = $<HTMLInputElement>('urlInput');
const loadBtn = $<HTMLButtonElement>('loadUrlBtn');
const searchInput = $<HTMLInputElement>('searchInput');
const treeEl = $<HTMLDivElement>('tree');
const contentEl = $<HTMLElement>('content');

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
      group: 'Типы',
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
}

function loadDoc(doc: OpenRpcDocument): void {
  state.doc = doc;
  state.items = buildFlatItems(doc);
  state.activeId = null;
  state.drafts.clear();
  state.servers.clear();

  const methodCount = doc.methods?.length ?? 0;
  const typeCount = Object.keys(doc.components?.schemas ?? {}).length;
  setStatus(
    `Загружено: ${doc.info?.title ?? 'OpenRPC'} — методов: ${methodCount}, типов: ${typeCount}`,
  );

  refreshTree();

  const firstMethod = state.items.find((it) => it.kind === 'method');
  if (firstMethod) {
    selectItem(firstMethod.id);
  } else {
    contentEl.innerHTML = `<div class="placeholder"><h2>Схема загружена</h2><p>В документе нет методов.</p></div>`;
  }
}

async function loadFromUrl(url: string): Promise<void> {
  if (!url) {
    setStatus('Введите URL.', true);
    return;
  }
  setStatus('Загрузка…');
  try {
    const doc = await fetchDocument(url);
    loadDoc(doc);
  } catch (err) {
    setStatus(`Ошибка загрузки: ${(err as Error).message}`, true);
  }
}

loadBtn.addEventListener('click', () => void loadFromUrl(urlInput.value.trim()));
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') void loadFromUrl(urlInput.value.trim());
});
searchInput.addEventListener('input', refreshTree);

const specUrl = new URLSearchParams(location.search).get('spec');
if (specUrl) {
  urlInput.value = specUrl;
  void loadFromUrl(specUrl);
}