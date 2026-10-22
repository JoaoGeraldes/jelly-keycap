/**
 * Translations. Each component's text lives in one file per language, named after the
 * component: src/i18n/en/ItemEditor.js and src/i18n/pt/ItemEditor.js. Each language's
 * index.js lists its files. A text that includes a value is a function, like (title) => `…`.
 *
 * English is the reference: tests/i18n.test.js fails if another language is missing a text,
 * and anything missing still shows in English rather than breaking the screen.
 * The chosen language is remembered in this browser only; until one is chosen, the browser's is used.
 */
import en from '../i18n/en/index.js';
import pt from '../i18n/pt/index.js';

export const LANGUAGES = { en: 'English', pt: 'Português' };
export const TRANSLATIONS = { en, pt };
const STORAGE_KEY = 'vault-language';

/** The chosen language, as a language code. Reactive: changing it updates every text on screen. */
export const language = $state({ code: loadLanguage() });
applyLanguage();

export function setLanguage(code) {
  language.code = code;
  applyLanguage();
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Not remembered, but still used for this visit.
  }
}

/** One component's texts in the chosen language, read as `text.save` or `text.notSaved(reason)`. */
export function textFor(component) {
  // A Proxy, so each text is looked up when it's shown and follows a language change.
  return new Proxy({}, { get: (_, key) => TRANSLATIONS[language.code][component]?.[key] ?? en[component][key] });
}

function loadLanguage() {
  let saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage can be blocked (private windows, strict settings); the browser's language still works.
  }
  const browserLanguage = globalThis.navigator?.language?.slice(0, 2);
  return [saved, browserLanguage].find((code) => code in LANGUAGES) ?? 'en';
}

// Screen readers and spell checkers use <html lang> to know which language they're reading.
function applyLanguage() {
  if (globalThis.document) document.documentElement.lang = language.code;
}
