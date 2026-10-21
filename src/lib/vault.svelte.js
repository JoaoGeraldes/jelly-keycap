/**
 * The vault session: the one place that knows about both keys and the server.
 *
 * Components read `session` and call the functions below. Each function encrypts on the
 * way to the server and decrypts on the way back, so components only ever see plain
 * objects like { id, vaultId, title, username, password, url, notes }.
 *
 * Key hierarchy:
 *   master password ──Argon2id──▶ master key ──unwraps──▶ one key per vault ──decrypts──▶ items
 *
 * The keys live only in memory. Locking (or closing the tab) forgets them.
 */
import { api } from './api.js';
import {
  DEFAULT_KDF_PARAMS,
  decryptBytes,
  decryptJson,
  deriveMasterKey,
  encryptBytes,
  encryptJson,
  fromBase64,
  generateKey,
  importKey,
  randomBytes,
  toBase64,
} from './crypto.js';

export const MINIMUM_MASTER_PASSWORD_LENGTH = 10;

// Any fixed text works; decrypting it successfully is how we know the password is right.
const VERIFIER_TEXT = 'vault-master-password-check';

/** Reactive state for the UI. `lockReason` explains an automatic lock on the lock screen. */
export const session = $state({ isUnlocked: false, lockReason: '', vaults: [], items: [] });

// Kept out of `session` so components can't reach them. The salt identifies which master key
// this window holds; the server refuses vault writes made with an outdated one.
let masterKey = null;
let masterKeySalt = null;

/** True once a master password has been created on this server. */
export async function hasMasterPassword() {
  return (await api.getKeyDerivation()) !== null;
}

/** First run: stores the key-derivation settings and creates a "Personal" vault. */
export async function createMasterPassword(password) {
  const { key, keyDerivation } = await createMasterKey(password);
  await api.createKeyDerivation(keyDerivation);
  masterKey = key;
  masterKeySalt = keyDerivation.salt;
  Object.assign(session, { lockReason: '', vaults: [], items: [] });
  await createVault('Personal');
  session.isUnlocked = true; // only now, so the vault screen opens with Personal already there
}

/** Checks the password, then downloads and decrypts every vault and item. */
export async function unlock(password) {
  const checked = await deriveCheckedMasterKey(password);
  masterKey = checked.key;
  masterKeySalt = checked.salt;

  const vaults = await Promise.all((await api.listVaults()).map(decryptVault));
  const keysByVaultId = new Map(vaults.map((vault) => [vault.id, vault.key]));
  const items = await Promise.all((await api.listItems()).map((row) => decryptItem(row, keysByVaultId.get(row.vaultId))));
  Object.assign(session, { isUnlocked: true, lockReason: '', vaults, items });
}

/** Forgets every key and every decrypted value. */
export function lock(reason = '') {
  masterKey = null;
  masterKeySalt = null;
  Object.assign(session, { isUnlocked: false, lockReason: reason, vaults: [], items: [] });
}

/**
 * Replaces the master password. Items are not touched: only each vault key is re-wrapped
 * with the new master key, and the server saves everything in one transaction, so if
 * anything fails the old password keeps working.
 */
export async function changeMasterPassword(currentPassword, newPassword) {
  const current = await deriveCheckedMasterKey(currentPassword);
  const { key: newKey, keyDerivation } = await createMasterKey(newPassword);

  // Uses the server's list of vaults, not this window's, so no vault is left on the old password.
  const rewrappedVaultKeys = {};
  for (const { id, wrappedKey } of await api.listVaults()) {
    const vaultKey = await decryptBytes(current.key, wrappedKey, `vault-key:${id}`);
    rewrappedVaultKeys[id] = await encryptBytes(newKey, vaultKey, `vault-key:${id}`);
  }

  await lockIfOutdated(() =>
    api.changeMasterPassword({ masterKeySalt: current.salt, newKeyDerivation: keyDerivation, rewrappedVaultKeys }),
  );
  masterKey = newKey;
  masterKeySalt = keyDerivation.salt;
}

export async function createVault(name) {
  const id = crypto.randomUUID();
  const { rawKey, key } = await generateKey();
  const vault = {
    masterKeySalt,
    wrappedKey: await encryptBytes(masterKey, rawKey, `vault-key:${id}`),
    nameEnc: await encryptJson(key, name, `vault-name:${id}`),
  };
  await lockIfOutdated(() => api.saveVault(id, vault));
  session.vaults.push({ id, name, key });
  return id;
}

/** Deletes the vault and, on the server, every item in it. Asks for the master password first. */
export async function deleteVault(vaultId, masterPassword) {
  await deriveCheckedMasterKey(masterPassword); // throws if the password is wrong
  await api.deleteVault(vaultId);
  session.vaults = session.vaults.filter((vault) => vault.id !== vaultId);
  session.items = session.items.filter((item) => item.vaultId !== vaultId);
}

/**
 * Replaces the whole vault with a backup file. Asks for the current master password first.
 * The server keeps a copy of the current vault, so this can be undone by restoring that copy.
 * Afterwards the app locks, because the backup opens with the password it was made with.
 */
export async function restoreBackup(backupFile, masterPassword) {
  await deriveCheckedMasterKey(masterPassword); // throws if the password is wrong
  const backup = toBase64(new Uint8Array(await backupFile.arrayBuffer()));
  const { safetyCopyPath } = await api.restoreBackup(backup);
  const safetyCopyName = safetyCopyPath.split(/[\\/]/).pop(); // the Database screen shows the folder
  lock(
    `Backup restored. Unlock it with the master password you used when it was made. ` +
      `Your previous vault is safe, saved next to it as ${safetyCopyName}.`,
  );
  return safetyCopyPath;
}

/** An unsaved login for the editor. It only reaches the server through saveItem. */
export function newItem(vaultId) {
  return { id: crypto.randomUUID(), vaultId, type: 'login', title: '', username: '', password: '', url: '', notes: '' };
}

/** Creates or updates an item. Encrypts with the key of whichever vault the item is in. */
export async function saveItem(item) {
  const { id, vaultId, type, ...fields } = item;
  const vaultKey = session.vaults.find((vault) => vault.id === vaultId).key;
  await api.saveItem(id, { vaultId, type, dataEnc: await encryptJson(vaultKey, fields, `item:${id}`) });

  const savedItem = { ...item };
  const index = session.items.findIndex((existing) => existing.id === id);
  if (index === -1) session.items.push(savedItem);
  else session.items[index] = savedItem;
  return savedItem;
}

export async function deleteItem(itemId) {
  await api.deleteItem(itemId);
  session.items = session.items.filter((item) => item.id !== itemId);
}

/** A new random-salted master key, plus the settings the server stores to re-derive and check it. */
async function createMasterKey(password) {
  if (password.length < MINIMUM_MASTER_PASSWORD_LENGTH) {
    throw new Error(`Use at least ${MINIMUM_MASTER_PASSWORD_LENGTH} characters.`);
  }
  const salt = randomBytes(16);
  const key = await deriveMasterKey(password, salt, DEFAULT_KDF_PARAMS);
  const keyDerivation = {
    kdfParams: JSON.stringify(DEFAULT_KDF_PARAMS),
    salt: toBase64(salt),
    verifier: await encryptJson(key, VERIFIER_TEXT, 'verifier'),
  };
  return { key, keyDerivation };
}

/** Derives the master key from the server's current settings. Throws if the password is wrong. */
async function deriveCheckedMasterKey(password) {
  const { kdfParams, salt, verifier } = await api.getKeyDerivation();
  const key = await deriveMasterKey(password, fromBase64(salt), JSON.parse(kdfParams));
  try {
    await decryptJson(key, verifier, 'verifier');
  } catch {
    throw new Error('That master password is not right. Try again.');
  }
  return { key, salt };
}

// The server answers 409 when this window's master key is outdated (the password was changed
// in another window). Locking makes the user unlock again with the current password.
async function lockIfOutdated(save) {
  try {
    await save();
  } catch (error) {
    if (error.status === 409) lock(error.message);
    throw error;
  }
}

async function decryptVault({ id, wrappedKey, nameEnc }) {
  const key = await importKey(await decryptBytes(masterKey, wrappedKey, `vault-key:${id}`));
  return { id, name: await decryptJson(key, nameEnc, `vault-name:${id}`), key };
}

async function decryptItem({ id, vaultId, type, dataEnc }, vaultKey) {
  return { id, vaultId, type, ...(await decryptJson(vaultKey, dataEnc, `item:${id}`)) };
}
