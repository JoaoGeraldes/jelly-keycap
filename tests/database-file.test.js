import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openWindow, startEmptyServer } from './support/browser.js';

const PASSWORD = 'correct horse battery staple';
const NEW_PASSWORD = 'purple elephant umbrella';

// Each test gets a real vault file in its own temporary folder, so we can see what lands next to it.
let folder;
let server;
let window;
beforeEach(async () => {
  folder = mkdtempSync(join(tmpdir(), 'vault-test-'));
  server = await startEmptyServer({ databasePath: join(folder, 'vault.sqlite') });
  window = await openWindow();
  await window.createMasterPassword(PASSWORD);
});
afterEach(() => {
  server.stop();
  rmSync(folder, { recursive: true });
});

/** A backup as the Download backup link gives it, in the form a browser would upload it. */
async function downloadBackup() {
  return new Blob([await (await fetch('/api/backup')).arrayBuffer()]);
}

const addLogin = (title) => window.saveItem({ ...window.newItem(window.session.vaults[0].id), title });
const loginTitles = () => window.session.items.map((item) => item.title).sort();

test('the database screen shows the full path and size of the vault file', async () => {
  const file = await (await fetch('/api/database-file')).json();

  assert.equal(file.path, join(folder, 'vault.sqlite'));
  assert.ok(file.sizeBytes > 0);
});

test('restoring a backup brings back its logins, opened with the password it was made with', async () => {
  await addLogin('GitHub');
  const backup = await downloadBackup();
  await addLogin('AWS');
  await window.changeMasterPassword(PASSWORD, NEW_PASSWORD);

  await window.restoreBackup(backup, NEW_PASSWORD);

  assert.equal(window.session.isUnlocked, false);
  assert.match(window.session.lockReason, /Backup restored/);
  await assert.rejects(window.unlock(NEW_PASSWORD), /not right/);
  await window.unlock(PASSWORD);
  assert.deepEqual(loginTitles(), ['GitHub']);
});

test('the vault from before a restore is kept next to it, and restoring that copy switches back', async () => {
  await addLogin('GitHub');
  const backup = await downloadBackup();
  await addLogin('AWS');

  const safetyCopyPath = await window.restoreBackup(backup, PASSWORD);
  assert.ok(existsSync(safetyCopyPath));
  assert.ok(safetyCopyPath.startsWith(folder));

  await window.unlock(PASSWORD);
  await window.restoreBackup(new Blob([readFileSync(safetyCopyPath)]), PASSWORD);
  await window.unlock(PASSWORD);
  assert.deepEqual(loginTitles(), ['AWS', 'GitHub']);
});

test('a file that isn’t a backup is refused, and nothing changes', async () => {
  await addLogin('GitHub');

  await assert.rejects(window.restoreBackup(new Blob(['not a database']), PASSWORD), /isn’t a Vault backup/);

  assert.equal(window.session.isUnlocked, true);
  window.lock();
  await window.unlock(PASSWORD);
  assert.deepEqual(loginTitles(), ['GitHub']);
});

test('a damaged backup that fails halfway through changes nothing', async () => {
  await addLogin('GitHub');
  const backup = await downloadBackup();
  await addLogin('AWS');

  // The backup gets a login pointing at a vault that doesn't exist, so restoring it fails partway.
  const damagedPath = join(folder, 'damaged.sqlite');
  writeFileSync(damagedPath, Buffer.from(await backup.arrayBuffer()));
  const damaged = new DatabaseSync(damagedPath, { enableForeignKeyConstraints: false }); // allows the bad row
  damaged.prepare("INSERT INTO items VALUES ('broken', 'no-such-vault', 'login', 'x', 0, 0)").run();
  damaged.close();

  await assert.rejects(window.restoreBackup(new Blob([readFileSync(damagedPath)]), PASSWORD));

  window.lock();
  await window.unlock(PASSWORD);
  assert.deepEqual(loginTitles(), ['AWS', 'GitHub']);
});

test('restoring needs the current master password', async () => {
  const backup = await downloadBackup();

  await assert.rejects(window.restoreBackup(backup, 'wrong password'), /not right/);

  assert.equal(window.session.isUnlocked, true);
});
