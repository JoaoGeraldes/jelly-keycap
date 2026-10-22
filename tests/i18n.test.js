import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGES, TRANSLATIONS, setLanguage, textFor } from '../src/lib/i18n.svelte.js';

/** Checks `translation` has every key `english` has, and no others, at every level of nesting. */
function assertSameShape(translation, english, path) {
  assert.deepEqual(Object.keys(translation).sort(), Object.keys(english).sort(), `${path}: same texts as English`);
  for (const [key, value] of Object.entries(english)) {
    assert.equal(typeof translation[key], typeof value, `${path}.${key}: text, function or group, like English`);
    if (typeof value === 'object') assertSameShape(translation[key], value, `${path}.${key}`);
  }
}

test('every language has the same texts as English, of the same kind', () => {
  for (const code of Object.keys(LANGUAGES)) assertSameShape(TRANSLATIONS[code], TRANSLATIONS.en, code);
});

/** The names of every [words](name) link in a group of texts, sorted. */
function linkNames(texts) {
  return [...JSON.stringify(texts).matchAll(/\]\((\w+)\)/g)].map((match) => match[1]).sort();
}

test('every language links to the same places as English', () => {
  for (const code of Object.keys(LANGUAGES)) {
    for (const [component, texts] of Object.entries(TRANSLATIONS.en)) {
      assert.deepEqual(linkNames(TRANSLATIONS[code][component]), linkNames(texts), `${code}/${component}`);
    }
  }
});

test('texts follow the chosen language', () => {
  const text = textFor('ItemEditor');

  setLanguage('pt');
  assert.equal(text.save, 'Guardar');
  assert.equal(text.notSaved('sem ligação'), 'Não guardado: sem ligação');

  setLanguage('en');
  assert.equal(text.save, 'Save');
});

test('a text not yet translated shows in English', () => {
  const portuguese = TRANSLATIONS.pt.ItemEditor;
  const { save } = portuguese;
  delete portuguese.save;
  setLanguage('pt');

  assert.equal(textFor('ItemEditor').save, 'Save');

  portuguese.save = save;
  setLanguage('en');
});
