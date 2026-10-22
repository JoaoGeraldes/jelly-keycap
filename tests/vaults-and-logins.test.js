import { afterEach, beforeEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openWindow, readRaw, startEmptyServer } from './support/browser.js';

const PASSWORD = 'correct horse battery staple';

let server;
let window;
beforeEach(async () => {
  server = await startEmptyServer();
  window = await openWindow();
  await window.createMasterPassword(PASSWORD);
});
afterEach(() => {
  mock.timers.reset();
  server.stop();
});

const personalVaultId = () => window.session.vaults[0].id;

/** Locks and unlocks again, so the test sees what was really saved on the server. */
async function relock() {
  window.lock();
  await window.unlock(PASSWORD);
}

test('a new master password comes with one empty vault called Personal', () => {
  assert.deepEqual(window.session.vaults.map((vault) => vault.name), ['Personal']);
  assert.deepEqual(window.session.items, []);
});

test('a saved login comes back after unlocking again', async () => {
  const login = { ...window.newItem(personalVaultId()), title: 'GitHub', username: 'joao', password: 'github-secret' };
  await window.saveItem(login);

  await relock();

  assert.deepEqual(window.session.items, [login]);
});

test('the server only ever stores encrypted names and logins', async () => {
  await window.createVault('Work');
  await window.saveItem({ ...window.newItem(personalVaultId()), title: 'GitHub', password: 'github-secret' });

  const storedOnServer = (await readRaw('vaults')) + (await readRaw('items'));

  for (const secret of ['Work', 'Personal', 'GitHub', 'github-secret']) {
    assert.ok(!storedOnServer.includes(secret), `"${secret}" is readable on the server`);
  }
});

test('editing a login updates it instead of adding a copy', async () => {
  const login = await window.saveItem({ ...window.newItem(personalVaultId()), title: 'GitHub', password: 'old' });

  await window.saveItem({ ...login, password: 'new' });
  await relock();

  assert.deepEqual(window.session.items.map((item) => item.password), ['new']);
});

test('a login moved to another vault stays readable there', async () => {
  const workId = await window.createVault('Work');
  const login = await window.saveItem({ ...window.newItem(personalVaultId()), title: 'GitHub' });

  await window.saveItem({ ...login, vaultId: workId });
  await relock();

  assert.equal(window.session.items[0].vaultId, workId);
});

test('a cloned login is a separate copy with the same fields, named "(clone 1)"', async () => {
  const login = await window.saveItem({
    ...window.newItem(personalVaultId()),
    title: 'GitHub',
    username: 'me@example.com',
    password: 'secret',
  });

  const clone = await window.saveItem(window.cloneItem(login));
  await relock();

  assert.notEqual(clone.id, login.id);
  assert.deepEqual({ ...clone, id: login.id, title: 'GitHub' }, login);
  assert.deepEqual(window.session.items.map((item) => item.title).sort(), ['GitHub', 'GitHub (clone 1)']);
});

test('each clone takes the next free number, also when cloning a clone', async () => {
  const login = await window.saveItem({ ...window.newItem(personalVaultId()), title: 'ASD' });

  const first = await window.saveItem(window.cloneItem(login));
  const second = await window.saveItem(window.cloneItem(login));
  const cloneOfClone = window.cloneItem(first);

  assert.equal(first.title, 'ASD (clone 1)');
  assert.equal(second.title, 'ASD (clone 2)');
  assert.equal(cloneOfClone.title, 'ASD (clone 3)');
});

test('a deleted login leaves the list at once, and the server once the time to undo runs out', async () => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const login = await window.saveItem({ ...window.newItem(personalVaultId()), title: 'GitHub' });

  const deleted = window.deleteItem(login.id);
  assert.deepEqual(window.session.items, []);
  mock.timers.tick(window.UNDO_DELETE_MS);
  await deleted;
  await relock();

  assert.deepEqual(window.session.items, []);
});

test('undo puts a deleted login back in its place, and the server keeps it', async () => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const vaultId = personalVaultId();
  for (const title of ['A', 'B', 'C']) await window.saveItem({ ...window.newItem(vaultId), title });
  const second = window.session.items[1];

  const deleted = window.deleteItem(second.id);
  window.undoDeletion(second.id);
  mock.timers.tick(window.UNDO_DELETE_MS);
  await deleted;

  assert.deepEqual(window.session.items.map((item) => item.title), ['A', 'B', 'C']);
  await relock();
  assert.equal(window.session.items.length, 3);
});

test('pausing stops the countdown until it resumes', async () => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const login = await window.saveItem({ ...window.newItem(personalVaultId()), title: 'GitHub' });

  const deleted = window.deleteItem(login.id);
  mock.timers.tick(1000);
  window.pauseDeletions();
  mock.timers.tick(window.UNDO_DELETE_MS);
  assert.equal(window.pendingDeletions.length, 1);

  window.resumeDeletions();
  mock.timers.tick(window.UNDO_DELETE_MS - 1000);
  await deleted;
  assert.equal(window.pendingDeletions.length, 0);
});

test('locking before the time to undo runs out keeps the login', async () => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const login = await window.saveItem({ ...window.newItem(personalVaultId()), title: 'GitHub' });

  const deleted = window.deleteItem(login.id);
  window.lock();
  mock.timers.tick(window.UNDO_DELETE_MS);
  await deleted;
  await window.unlock(PASSWORD);

  assert.deepEqual(window.session.items.map((item) => item.title), ['GitHub']);
});

test('deleting a vault deletes its logins and leaves other vaults alone', async () => {
  const workId = await window.createVault('Work');
  await window.saveItem({ ...window.newItem(workId), title: 'AWS' });
  await window.saveItem({ ...window.newItem(personalVaultId()), title: 'GitHub' });

  await window.deleteVault(workId, PASSWORD);
  await relock();

  assert.deepEqual(window.session.vaults.map((vault) => vault.name), ['Personal']);
  assert.deepEqual(window.session.items.map((item) => item.title), ['GitHub']);
});

test('a vault with logins is only deleted with the right master password', async () => {
  const workId = await window.createVault('Work');
  await window.saveItem({ ...window.newItem(workId), title: 'AWS' });

  await assert.rejects(window.deleteVault(workId, 'wrong password'), /not right/);
  await relock();

  assert.deepEqual(window.session.vaults.map((vault) => vault.name), ['Personal', 'Work']);
  assert.deepEqual(window.session.items.map((item) => item.title), ['AWS']);
});

test('an empty vault is deleted right away, without the master password', async () => {
  const workId = await window.createVault('Work');

  await window.deleteVault(workId);
  await relock();

  assert.deepEqual(window.session.vaults.map((vault) => vault.name), ['Personal']);
});

test('the backup is a complete SQLite copy with no readable secrets', async () => {
  await window.saveItem({ ...window.newItem(personalVaultId()), title: 'GitHub', password: 'github-secret' });

  const backup = Buffer.from(await (await fetch('/api/backup')).arrayBuffer());
  const backupPath = join(tmpdir(), `vault-test-backup-${process.pid}.sqlite`);
  writeFileSync(backupPath, backup);
  const backupDatabase = new DatabaseSync(backupPath);
  const { itemCount } = backupDatabase.prepare('SELECT count(*) AS itemCount FROM items').get();
  backupDatabase.close();
  rmSync(backupPath);

  assert.equal(itemCount, 1);
  assert.ok(!backup.includes('github-secret'));
});
