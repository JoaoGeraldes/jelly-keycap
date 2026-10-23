/**
 * The person's settings live in the database's user_settings table, so they are the same in every
 * browser and in the desktop app. Each setting saves itself when changed (updateDisplaySettings,
 * setLanguage, setAutoLockMinutes); this reads them all back once, when the app starts.
 */
import { api } from './api.js';
import { setAutoLockMinutes } from './auto-lock.svelte.js';
import { updateDisplaySettings } from './display-settings.svelte.js';
import { setLanguage } from './i18n.svelte.js';

/** Applies the saved settings. Anything not chosen yet, or a server that can't be reached, keeps the defaults. */
export async function loadUserSettings() {
  try {
    const { theme, textScale, language, autoLockMinutes } = await api.getUserSettings();
    updateDisplaySettings({ theme, textScale }, { save: false });
    setLanguage(language, { save: false });
    setAutoLockMinutes(autoLockMinutes, { save: false });
  } catch {
    // The lock screen says the server can't be reached; the defaults are fine until then.
  }
}
