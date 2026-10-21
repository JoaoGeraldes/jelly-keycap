/**
 * The "How it works" diagrams: what happens between your master password and the database.
 * Two versions of the same story, read left to right: `simple` in everyday words with few
 * nodes, and `technical` with every algorithm, key and database column.
 *
 * kind: 'browser' exists only in your browser's memory, 'server' is stored in the database,
 *       'step' is an algorithm.
 * docs: links to the official documentation of an algorithm, shown under its note.
 */
import { DEFAULT_KDF_PARAMS } from './crypto.js';

const { memoryKiB, iterations, parallelism } = DEFAULT_KDF_PARAMS;

const AES_GCM_SPEC = { title: 'NIST SP 800-38D: AES-GCM', url: 'https://csrc.nist.gov/pubs/sp/800/38/d/final' };
const WEBCRYPTO_ENCRYPT = { title: 'MDN: SubtleCrypto.encrypt()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt' };
const WEBCRYPTO_DECRYPT = { title: 'MDN: SubtleCrypto.decrypt()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/decrypt' };

const technicalNodes = [
  // What you type, and what is generated at random
  { id: 'password', title: 'Master password', kind: 'browser', x: 0, y: 40,
    note: 'Typed by you to unlock. Never stored and never sent to the server.' },
  { id: 'random', title: 'Random generator', kind: 'step', x: 0, y: 220,
    note: 'crypto.getRandomValues: the browser’s cryptographically secure random numbers.',
    docs: [{ title: 'MDN: Crypto.getRandomValues()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues' }] },
  { id: 'vaultName', title: 'Vault name', kind: 'browser', x: 0, y: 440,
    note: 'The name you give a vault, like Work.' },
  { id: 'login', title: 'Login', kind: 'browser', x: 0, y: 520,
    note: 'Title, username, password, website and notes, together as one JSON object.' },

  { id: 'salt', title: 'Salt', kind: 'server', x: 200, y: 0,
    note: '16 random bytes, stored in key_derivation.salt. Not secret. It makes the same password give a different key on every install, so attackers can’t reuse precomputed guesses. A new one is made when you change the password.' },
  { id: 'kdfParams', title: 'Argon2id settings', kind: 'server', x: 200, y: 80,
    note: `${memoryKiB / 1024} MiB of memory, ${iterations} passes, ${parallelism} lane. Stored in key_derivation.kdf_params, so they can be made stronger later without breaking old vaults.` },
  { id: 'vaultKey', title: 'Vault key', kind: 'browser', x: 200, y: 180,
    note: 'A random 256-bit key, one per vault. It encrypts that vault’s name and logins. Changing the master password only re-wraps this key; no login is re-encrypted.' },
  { id: 'nonce', title: 'Nonce', kind: 'browser', x: 200, y: 260,
    note: '12 random bytes, new for every encryption, stored in front of the ciphertext. The same data never encrypts the same way twice.' },
  { id: 'context', title: 'Context', kind: 'browser', x: 200, y: 340,
    note: 'Names the row the data belongs to, like item:<id>. Not secret and not stored, but it must match to decrypt, so ciphertext can’t be moved to another row.' },

  // Deriving the master key
  { id: 'argon2', title: 'Argon2id', kind: 'step', x: 400, y: 40,
    note: 'A deliberately slow, memory-hungry hash. Turns password + salt into a key, and makes every guess at your password cost the same time and memory.',
    docs: [{ title: 'RFC 9106: Argon2', url: 'https://www.rfc-editor.org/rfc/rfc9106' }] },
  { id: 'masterKey', title: 'Master key', kind: 'browser', x: 600, y: 40,
    note: 'The 256-bit key Argon2id produces. Kept only in memory while unlocked. Its only job is to lock and unlock the vault keys.' },

  // Encrypting
  { id: 'wrap', title: 'Wrap: AES-256-GCM', kind: 'step', x: 800, y: 220,
    note: 'Encrypts the vault key with the master key. GCM also adds a tag that detects any change to the data.',
    docs: [AES_GCM_SPEC, WEBCRYPTO_ENCRYPT] },
  { id: 'encrypt', title: 'Encrypt: AES-256-GCM', kind: 'step', x: 800, y: 440,
    note: 'Encrypts vault names and logins with the vault key. Built into every browser (WebCrypto).',
    docs: [AES_GCM_SPEC, WEBCRYPTO_ENCRYPT] },

  // What the server stores
  { id: 'verifier', title: 'key_derivation.verifier', kind: 'server', x: 1000, y: 40,
    note: 'A fixed text encrypted with the master key. Unlocking tries to decrypt it: if that works, the password is right.' },
  { id: 'wrappedKey', title: 'vaults.wrapped_key', kind: 'server', x: 1000, y: 220,
    note: 'The vault key, encrypted, stored as base64(nonce + ciphertext).' },
  { id: 'nameEnc', title: 'vaults.name_enc', kind: 'server', x: 1000, y: 400,
    note: 'The vault name, encrypted.' },
  { id: 'dataEnc', title: 'items.data_enc', kind: 'server', x: 1000, y: 480,
    note: 'The login, encrypted. This is all the server ever sees of it.' },

  // Unlocking
  { id: 'unwrap', title: 'Unwrap: AES-256-GCM', kind: 'step', x: 1200, y: 130,
    note: 'On unlock, the master key decrypts each vault key. It fails if the password is wrong or the data was changed.',
    docs: [AES_GCM_SPEC, WEBCRYPTO_DECRYPT] },
  { id: 'decrypt', title: 'Decrypt: AES-256-GCM', kind: 'step', x: 1200, y: 440,
    note: 'The vault key decrypts names and logins. The GCM tag is checked first, so changed data fails instead of showing garbage.',
    docs: [AES_GCM_SPEC, WEBCRYPTO_DECRYPT] },
  { id: 'onScreen', title: 'On your screen', kind: 'browser', x: 1400, y: 440,
    note: 'Your vaults and logins, readable only while unlocked. Locking or closing the tab forgets them and every key.' },
];

/** [from, to]: the output of `from` is an input of `to`. */
const technicalConnections = [
  ['password', 'argon2'],
  ['salt', 'argon2'],
  ['kdfParams', 'argon2'],
  ['random', 'salt'],
  ['random', 'vaultKey'],
  ['random', 'nonce'],
  ['argon2', 'masterKey'],
  ['masterKey', 'verifier'],

  ['masterKey', 'wrap'],
  ['vaultKey', 'wrap'],
  ['nonce', 'wrap'],
  ['context', 'wrap'],
  ['wrap', 'wrappedKey'],

  ['vaultKey', 'encrypt'],
  ['vaultName', 'encrypt'],
  ['login', 'encrypt'],
  ['nonce', 'encrypt'],
  ['context', 'encrypt'],
  ['encrypt', 'nameEnc'],
  ['encrypt', 'dataEnc'],

  ['masterKey', 'unwrap'],
  ['wrappedKey', 'unwrap'],
  ['context', 'unwrap'],
  ['unwrap', 'decrypt'],
  ['nameEnc', 'decrypt'],
  ['dataEnc', 'decrypt'],
  ['context', 'decrypt'],
  ['decrypt', 'onScreen'],
];

const simpleNodes = [
  { id: 'password', title: 'Your master password', kind: 'browser', x: 0, y: 0,
    note: 'The one password you remember. It never leaves your device, and nobody can reset it for you, so keep it somewhere safe.' },
  { id: 'salt', title: 'A random ingredient', kind: 'server', x: 0, y: 100,
    note: 'Made once when you set up, and kept with your vault (its technical name is “salt”). It isn’t secret. It makes your key unique, even if someone else picks the same password.' },
  { id: 'makeKey', title: 'Slowly make a key', kind: 'step', x: 200, y: 50,
    note: 'Your password and the ingredient are mixed into a key. This is deliberately slow: barely noticeable for you, but it makes trying millions of guessed passwords take far too long.' },
  { id: 'masterKey', title: 'Your master key', kind: 'browser', x: 400, y: 50,
    note: 'Exists only while your vault is unlocked. Locking, or closing the tab, throws it away.' },
  { id: 'vaultKeys', title: 'A key for each vault', kind: 'browser', x: 600, y: 50,
    note: 'Every vault has its own random key, and your master key locks them all. Changing your master password only re-locks these keys.' },
  { id: 'logins', title: 'Your logins', kind: 'browser', x: 600, y: 200,
    note: 'Usernames, passwords, websites and notes, as you type them.' },
  { id: 'lock', title: 'Lock', kind: 'step', x: 800, y: 200,
    note: 'Your logins are scrambled with the vault’s key on your device, before anything is sent. Scrambled, they look like random letters.' },
  { id: 'server', title: 'The server', kind: 'server', x: 1000, y: 200,
    note: 'Keeps only scrambled data. Someone who copies the whole file still can’t read a single password without your master password.' },
  { id: 'unlock', title: 'Unlock', kind: 'step', x: 1200, y: 120,
    note: 'When you unlock, your device downloads the scrambled data and unscrambles it itself, with your keys.' },
  { id: 'onScreen', title: 'On your screen', kind: 'browser', x: 1400, y: 120,
    note: 'Your logins, readable again, only on your device and only while unlocked.' },
];

const simpleConnections = [
  ['password', 'makeKey'],
  ['salt', 'makeKey'],
  ['makeKey', 'masterKey'],
  ['masterKey', 'vaultKeys'],
  ['vaultKeys', 'lock'],
  ['logins', 'lock'],
  ['lock', 'server'],
  ['server', 'unlock'],
  ['vaultKeys', 'unlock'],
  ['unlock', 'onScreen'],
];

/** The tabs of the "How it works" panel, in order. `legend` names each kind of node. */
export const diagrams = [
  {
    name: 'Simple',
    legend: { browser: 'Only on your device', server: 'Kept on the server', step: 'Locking or unlocking' },
    nodes: simpleNodes,
    connections: simpleConnections,
  },
  {
    name: 'Technical',
    legend: { browser: 'Only in browser memory', server: 'Stored in the database', step: 'Algorithm' },
    nodes: technicalNodes,
    connections: technicalConnections,
  },
];
