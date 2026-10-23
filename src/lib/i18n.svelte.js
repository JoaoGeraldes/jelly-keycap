/**
 * Translations. Each component's text lives in one file per language, named after the
 * component: src/i18n/en/ItemEditor.js and src/i18n/pt/ItemEditor.js. Each language's
 * index.js lists its files. A text that includes a value is a function, like (title) => `…`.
 *
 * English is the reference: tests/i18n.test.js fails if another language is missing a text,
 * and anything missing still shows in English rather than breaking the screen.
 * The chosen language is saved in the database (see user-settings.js); until one is chosen, the
 * browser's is used.
 */
import { api } from './api.js';
import en from '../i18n/en/index.js';
import pt from '../i18n/pt/index.js';

export const LANGUAGES = { en: 'English', pt: 'Português' };
export const TRANSLATIONS = { en, pt };

/** The chosen language, as a language code. Reactive: changing it updates every text on screen. */
export const language = $state({ code: browserLanguage() });
applyLanguage();

/** Switches every text on screen. `save: false` is for the language just read from the database. */
export function setLanguage(code, { save = true } = {}) {
  if (!(code in LANGUAGES)) return;
  language.code = code;
  applyLanguage();
  if (save) return api.saveUserSettings({ language: code }).catch(() => {}); // if not saved, still used for this visit
}

/** One component's texts in the chosen language, read as `text.save` or `text.notSaved(reason)`. */
export function textFor(component) {
  // A Proxy, so each text is looked up when it's shown and follows a language change.
  return new Proxy({}, { get: (_, key) => TRANSLATIONS[language.code][component]?.[key] ?? en[component][key] });
}

function browserLanguage() {
  const code = globalThis.navigator?.language?.slice(0, 2);
  return code in LANGUAGES ? code : 'en';
}

// Screen readers and spell checkers use <html lang> to know which language they're reading.
function applyLanguage() {
  if (globalThis.document) document.documentElement.lang = language.code;
}
