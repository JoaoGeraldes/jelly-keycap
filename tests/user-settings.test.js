import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AUTO_LOCK_MINUTES, autoLock, setAutoLockMinutes } from '../src/lib/auto-lock.svelte.js';
import { displaySettings, updateDisplaySettings } from '../src/lib/display-settings.svelte.js';
import { language, setLanguage } from '../src/lib/i18n.svelte.js';
import { loadUserSettings } from '../src/lib/user-settings.js';
import { openWindow, startEmptyServer } from './support/browser.js';

let server;
beforeEach(async () => {
  server = await startEmptyServer();
  // Back to the defaults, as on a fresh start of the app.
  updateDisplaySettings({ textScale: 1, theme: 'light' }, { save: false });
  setLanguage('en', { save: false });
  setAutoLockMinutes(AUTO_LOCK_MINUTES.default, { save: false });
});
afterEach(() => server.stop());

const getJson = async (path) => (await fetch(`/api/${path}`)).json();
const putJson = (path, body) =>
  fetch(`/api/${path}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('a new vault has no settings chosen yet, so the app keeps its defaults', async () => {
  assert.deepEqual(await getJson('user-settings'), { theme: null, textScale: null, language: null, autoLockMinutes: null });

  await loadUserSettings();
  assert.equal(language.code, 'en');
  assert.equal(autoLock.minutes, 20);
});

test('choosing a theme, text size, language or auto-lock minutes saves it in the database', async () => {
  await updateDisplaySettings({ theme: 'dark' });
  await updateDisplaySettings({ textScale: 1.2 });
  await setLanguage('pt');
  await setAutoLockMinutes(45);

  assert.deepEqual(await getJson('user-settings'), { theme: 'dark', textScale: 1.2, language: 'pt', autoLockMinutes: 45 });
});

test('saving one setting leaves the others as they were', async () => {
  await putJson('user-settings', { language: 'pt', autoLockMinutes: 5 });
  await putJson('user-settings', { autoLockMinutes: 10 });

  assert.deepEqual(await getJson('user-settings'), { theme: null, textScale: null, language: 'pt', autoLockMinutes: 10 });
});

test('the saved settings are used when the app starts', async () => {
  await putJson('user-settings', { theme: 'dark', textScale: 1.3, language: 'pt', autoLockMinutes: 45 });

  await loadUserSettings();
  assert.deepEqual({ ...displaySettings }, { textScale: 1.3, theme: 'dark' });
  assert.equal(language.code, 'pt');
  assert.equal(autoLock.minutes, 45);
});

test('the app still starts, with its defaults, when the server can’t be reached', async () => {
  server.stop();

  await loadUserSettings();
  assert.deepEqual({ ...displaySettings }, { textScale: 1, theme: 'light' });
  assert.equal(language.code, 'en');
  assert.equal(autoLock.minutes, 20);
  server = await startEmptyServer(); // for afterEach
});

test('a database made before settings existed gets them on its next start', async () => {
  const path = join(tmpdir(), `vault-before-settings-${Date.now()}.sqlite`);
  const schema = readFileSync(new URL('../server/schema.sql', import.meta.url), 'utf8');
  const oldDatabase = new DatabaseSync(path);
  oldDatabase.exec(schema.slice(0, schema.indexOf('-- One row only. The person')));
  oldDatabase.close();
  server.stop();
  server = await startEmptyServer({ databasePath: path });
  try {
    assert.deepEqual(await getJson('user-settings'), { theme: null, textScale: null, language: null, autoLockMinutes: null });
  } finally {
    server.stop();
    rmSync(path);
    server = await startEmptyServer(); // for afterEach
  }
});

test('restoring a backup keeps the current settings', async () => {
  const window = await openWindow();
  await window.createMasterPassword('correct horse battery staple');
  await putJson('user-settings', { language: 'pt' });
  const backup = Buffer.from(await (await fetch('/api/backup')).arrayBuffer()).toString('base64');
  await putJson('user-settings', { language: 'en' });

  const restore = await fetch('/api/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ backup }),
  });

  assert.equal(restore.status, 200);
  assert.equal((await getJson('user-settings')).language, 'en');
});
