import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { openWindow, startEmptyServer } from './support/browser.js';

const PASSWORD = 'correct horse battery staple';
const NEW_PASSWORD = 'purple elephant umbrella';

let server;
beforeEach(async () => (server = await startEmptyServer()));
afterEach(() => server.stop());

test('a new server has no master password until one is created', async () => {
  const window = await openWindow();
  assert.equal(await window.hasMasterPassword(), false);

  await window.createMasterPassword(PASSWORD);

  assert.equal(await window.hasMasterPassword(), true);
  assert.equal(window.session.isUnlocked, true);
});

test('a master password can only be created once', async () => {
  const window = await openWindow();
  await window.createMasterPassword(PASSWORD);

  await assert.rejects(window.createMasterPassword('a different password'));
});

test('a master password shorter than 10 characters is refused', async () => {
  const window = await openWindow();

  await assert.rejects(window.createMasterPassword('too short'), /at least 10/);
  assert.equal(await window.hasMasterPassword(), false);
});

test('only the right password unlocks', async () => {
  const window = await openWindow();
  await window.createMasterPassword(PASSWORD);
  window.lock();

  await assert.rejects(window.unlock('wrong password'), /not right/);
  assert.equal(window.session.isUnlocked, false);

  await window.unlock(PASSWORD);
  assert.equal(window.session.isUnlocked, true);
});

test('locking forgets every decrypted vault and login', async () => {
  const window = await openWindow();
  await window.createMasterPassword(PASSWORD);
  await window.saveItem({ ...window.newItem(window.session.vaults[0].id), title: 'GitHub' });

  window.lock();

  assert.deepEqual(window.session.vaults, []);
  assert.deepEqual(window.session.items, []);
});

describe('changing the master password', () => {
  /** A server with two vaults and a login in each, unlocked in one window. */
  async function setUpTwoVaults() {
    const window = await openWindow();
    await window.createMasterPassword(PASSWORD);
    const personalId = window.session.vaults[0].id;
    const workId = await window.createVault('Work');
    await window.saveItem({ ...window.newItem(personalId), title: 'GitHub', password: 'github-secret' });
    await window.saveItem({ ...window.newItem(workId), title: 'AWS', password: 'aws-secret' });
    return window;
  }

  /** Unlocks in a new window and returns what it sees, sorted so it can be compared. */
  async function unlockInNewWindow(password) {
    const window = await openWindow();
    await window.unlock(password);
    return {
      vaultNames: window.session.vaults.map((vault) => vault.name).sort(),
      passwords: window.session.items.map((item) => item.password).sort(),
    };
  }

  /**
   * Sends a password change straight to the server, so a test controls exactly what it contains.
   * The new settings are dummies: these tests only check that they are NOT saved.
   */
  async function sendPasswordChange(rewrappedVaultKeys) {
    const { salt } = await (await fetch('/api/key-derivation')).json();
    const response = await fetch('/api/change-master-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        masterKeySalt: salt,
        newKeyDerivation: { kdfParams: '{}', salt: 'new-salt', verifier: 'new-verifier' },
        rewrappedVaultKeys,
      }),
    });
    return response.status;
  }

  test('afterwards only the new password unlocks, and every vault and login is still there', async () => {
    const window = await setUpTwoVaults();

    await window.changeMasterPassword(PASSWORD, NEW_PASSWORD);

    await assert.rejects(unlockInNewWindow(PASSWORD), /not right/);
    assert.deepEqual(await unlockInNewWindow(NEW_PASSWORD), {
      vaultNames: ['Personal', 'Work'],
      passwords: ['aws-secret', 'github-secret'],
    });
  });

  test('the window that changed it can keep adding vaults', async () => {
    const window = await setUpTwoVaults();
    await window.changeMasterPassword(PASSWORD, NEW_PASSWORD);

    await window.createVault('Family');

    assert.deepEqual((await unlockInNewWindow(NEW_PASSWORD)).vaultNames, ['Family', 'Personal', 'Work']);
  });

  test('a wrong current password changes nothing', async () => {
    const window = await setUpTwoVaults();

    await assert.rejects(window.changeMasterPassword('wrong password', NEW_PASSWORD), /not right/);

    assert.deepEqual((await unlockInNewWindow(PASSWORD)).vaultNames, ['Personal', 'Work']);
  });

  test('a new password shorter than 10 characters changes nothing', async () => {
    const window = await setUpTwoVaults();

    await assert.rejects(window.changeMasterPassword(PASSWORD, 'too short'), /at least 10/);

    assert.deepEqual((await unlockInNewWindow(PASSWORD)).vaultNames, ['Personal', 'Work']);
  });

  test('if saving fails halfway, nothing is changed and the old password still opens every vault', async () => {
    await setUpTwoVaults();
    const [personal, work] = await (await fetch('/api/vaults')).json();

    // The first vault update succeeds, the second fails because a wrapped key can't be null.
    const status = await sendPasswordChange({ [personal.id]: 'new-wrapped-key', [work.id]: null });

    assert.equal(status, 400);
    assert.deepEqual(await unlockInNewWindow(PASSWORD), {
      vaultNames: ['Personal', 'Work'],
      passwords: ['aws-secret', 'github-secret'],
    });
  });

  test('a vault added by another window during the change makes it fail, and nothing is changed', async () => {
    await setUpTwoVaults();
    const vaultsBeforeTheChange = await (await fetch('/api/vaults')).json();

    const otherWindow = await openWindow();
    await otherWindow.unlock(PASSWORD);
    await otherWindow.createVault('Added meanwhile');

    // The change only covers the vaults that existed when it started.
    const status = await sendPasswordChange(
      Object.fromEntries(vaultsBeforeTheChange.map((vault) => [vault.id, 'new-wrapped-key'])),
    );

    assert.equal(status, 409);
    assert.deepEqual((await unlockInNewWindow(PASSWORD)).vaultNames, ['Added meanwhile', 'Personal', 'Work']);
  });

  test('a window still on the old password is locked instead of adding a vault the new one can’t open', async () => {
    const window = await setUpTwoVaults();
    const staleWindow = await openWindow();
    await staleWindow.unlock(PASSWORD);

    await window.changeMasterPassword(PASSWORD, NEW_PASSWORD);

    await assert.rejects(staleWindow.createVault('Too late'), /changed in another window/);
    assert.equal(staleWindow.session.isUnlocked, false);
    assert.match(staleWindow.session.lockReason, /changed in another window/);
    assert.deepEqual((await unlockInNewWindow(NEW_PASSWORD)).vaultNames, ['Personal', 'Work']);
  });
});
