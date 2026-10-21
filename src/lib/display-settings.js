/**
 * Text size and theme. They are applied as --text-scale and data-theme on <html> (see app.css),
 * and remembered in this browser only. Until you pick a theme, the system's one is used.
 */

const STORAGE_KEY = 'vault-display-settings';
export const TEXT_SCALE = { min: 0.8, max: 1.6, step: 0.1 };

/** Your saved settings, or the defaults: normal text size and the system's theme. */
export function loadDisplaySettings() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    // Storage can be blocked (private windows, strict settings); the defaults still work.
  }
  const systemTheme = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  return { textScale: saved.textScale ?? 1, theme: saved.theme ?? systemTheme };
}

export function applyDisplaySettings({ textScale, theme }) {
  document.documentElement.style.setProperty('--text-scale', textScale);
  document.documentElement.dataset.theme = theme;
}

export function saveDisplaySettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Not remembered, but still applied for this visit.
  }
}

/** One step bigger (direction 1) or smaller (-1), kept within the limits. */
export function nextTextScale(textScale, direction) {
  const next = Math.round((textScale + direction * TEXT_SCALE.step) * 10) / 10; // avoids 1.2000000000000002
  return Math.min(TEXT_SCALE.max, Math.max(TEXT_SCALE.min, next));
}
