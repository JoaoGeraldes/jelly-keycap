/**
 * Text size and theme. They are applied as --text-scale and data-theme on <html> (see app.css),
 * and saved in the database (see user-settings.js). Until you pick a theme, the system's one is used.
 */
import { api } from './api.js';

export const TEXT_SCALE = { min: 0.8, max: 1.6, step: 0.1 };
const THEMES = ['light', 'dark'];

/** Reactive state for the UI: normal text size and the system's theme until changed. */
export const displaySettings = $state({ textScale: 1, theme: systemTheme() });
applyDisplaySettings();

/**
 * Applies `changes` ({ textScale, theme }, either or both) and saves them. Values that aren't a
 * text size within the limits or a known theme are ignored. `save: false` is for the settings
 * just read from the database.
 */
export function updateDisplaySettings(changes, { save = true } = {}) {
  const valid = {};
  const { textScale, theme } = changes;
  if (typeof textScale === 'number' && textScale >= TEXT_SCALE.min && textScale <= TEXT_SCALE.max) valid.textScale = textScale;
  if (THEMES.includes(theme)) valid.theme = theme;
  Object.assign(displaySettings, valid);
  applyDisplaySettings();
  if (save) return api.saveUserSettings(valid).catch(() => {}); // if not saved, still used for this visit
}

/** One step bigger (direction 1) or smaller (-1), kept within the limits. */
export function nextTextScale(textScale, direction) {
  const next = Math.round((textScale + direction * TEXT_SCALE.step) * 10) / 10; // avoids 1.2000000000000002
  return Math.min(TEXT_SCALE.max, Math.max(TEXT_SCALE.min, next));
}

function systemTheme() {
  return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Skipped outside a browser, as in the tests.
function applyDisplaySettings() {
  if (!globalThis.document) return;
  document.documentElement.style.setProperty('--text-scale', displaySettings.textScale);
  document.documentElement.dataset.theme = displaySettings.theme;
}
