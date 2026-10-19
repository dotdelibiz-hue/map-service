/** マーカーの大きさ（ズームに応じて変える）。参考: 16 で直径 45px */
export function markerSize(zoom: number): number {
  return Math.round(Math.max(30, Math.min(48, 45 * (zoom / 16) ** 1.4)));
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export function spotMarkerHtml(opts: {
  photoURL: string;
  title: string;
  size: number;
  selected?: boolean;
  visited?: boolean;
  count?: number;
  showTitle: boolean;
}): string {
  const { photoURL, title, size, selected, visited, count, showTitle } = opts;
  const cls = ['spot-pin', selected ? 'is-selected' : '', visited ? 'is-visited' : ''].filter(Boolean).join(' ');
  const badge = count && count > 1 ? `<span class="spot-pin__count">${count}</span>` : '';
  const check = visited && !count ? '<span class="spot-pin__check" aria-hidden="true">✓</span>' : '';
  return `<div class="${cls}" style="--s:${size}px">
    <div class="spot-pin__circle"><img src="${escapeHtml(photoURL)}" alt="" referrerpolicy="no-referrer" loading="lazy" draggable="false"/></div>
    ${badge}${check}
    ${showTitle ? `<div class="spot-pin__title">${escapeHtml(title)}</div>` : ''}
  </div>`;
}
