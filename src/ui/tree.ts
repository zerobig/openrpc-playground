import type { FlatItem } from '../state';
import { escapeHtml } from '../utils';
import { t } from '../i18n';

interface TreeOptions {
  items: FlatItem[];
  filter: string;
  activeId: string | null;
  onSelect: (id: string) => void;
}

const TYPES_GROUP = '__types__';

export function renderTree(treeEl: HTMLElement, opts: TreeOptions): void {
  const { items, filter, activeId, onSelect } = opts;

  if (!items.length) {
    treeEl.innerHTML = `<div class="placeholder" style="padding:32px 16px;"><p>${escapeHtml(t('placeholder.noItems'))}</p></div>`;
    return;
  }

  const q = filter.trim().toLowerCase();
  const filtered = q
    ? items.filter(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          (it.data.summary ?? '').toLowerCase().includes(q) ||
          (it.data.description ?? '').toLowerCase().includes(q),
      )
    : items;

  if (!filtered.length) {
    treeEl.innerHTML = `<div class="placeholder" style="padding:32px 16px;"><p>${escapeHtml(t('placeholder.noResults'))}</p></div>`;
    return;
  }

  const groups = new Map<string, FlatItem[]>();
  for (const it of filtered) {
    const arr = groups.get(it.group) ?? [];
    arr.push(it);
    groups.set(it.group, arr);
  }

  const sortedGroups = [...groups.keys()].sort((a, b) => {
    if (a === TYPES_GROUP) return 1;
    if (b === TYPES_GROUP) return -1;
    return a.localeCompare(b);
  });

  let html = '';
  for (const group of sortedGroups) {
    const groupLabel = group === TYPES_GROUP ? t('tree.group.types') : group;
    html += `<div class="tree-group-title">${escapeHtml(groupLabel)}</div>`;
    for (const it of groups.get(group)!) {
      const active = it.id === activeId ? ' active' : '';
      const icon = it.kind === 'method' ? 'ƒ' : '◇';
      const tooltip = it.data.summary || it.data.description || it.name;
      html += `<div class="tree-item${active}" data-id="${escapeHtml(it.id)}" title="${escapeHtml(tooltip)}">${icon} ${escapeHtml(it.name)}</div>`;
    }
  }

  treeEl.innerHTML = html;

  treeEl.querySelectorAll<HTMLElement>('.tree-item').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      if (id) onSelect(id);
    });
  });
}