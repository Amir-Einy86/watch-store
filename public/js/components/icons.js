// Builds inline SVG icons from window.ICON_PATHS (loaded from /js/icons-data.js).
const PATHS = window.ICON_PATHS || {};

export function icon(name, cls = '') {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${PATHS[name] || ''}</svg>`;
}
