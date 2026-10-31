export const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element #${id} not found`);
  return el as T;
};

export function setStatus(msg: string, isError = false): void {
  const el = $('status');
  el.textContent = msg || '';
  el.classList.toggle('error', isError);
}

export function escapeHtml(str: unknown): string {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function safeJson(value: unknown, indent = 2): string {
  try {
    return escapeHtml(JSON.stringify(value, null, indent));
  } catch {
    return escapeHtml(String(value));
  }
}