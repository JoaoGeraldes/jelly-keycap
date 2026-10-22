/**
 * The shape of the "How it works" diagrams: what happens between your master password and the
 * database. Two versions of the same story, read left to right: `simple` with few nodes, and
 * `technical` with every algorithm, key and database column. Their words (titles, notes, legend)
 * are in src/i18n/<language>/HowItWorks.js, by node id.
 *
 * kind: 'browser' exists only in your browser's memory, 'server' is stored in the database,
 *       'step' is an algorithm.
 * docs: links to the official documentation of an algorithm, shown under its note.
 */
const AES_GCM_SPEC = { title: 'NIST SP 800-38D: AES-GCM', url: 'https://csrc.nist.gov/pubs/sp/800/38/d/final' };
const WEBCRYPTO_ENCRYPT = { title: 'MDN: SubtleCrypto.encrypt()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt' };
const WEBCRYPTO_DECRYPT = { title: 'MDN: SubtleCrypto.decrypt()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/decrypt' };

const technicalNodes = [
  // What you type, and what is generated at random
  { id: 'password', kind: 'browser', x: 0, y: 40 },
  { id: 'random', kind: 'step', x: 0, y: 220,
    docs: [{ title: 'MDN: Crypto.getRandomValues()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues' }] },
  { id: 'vaultName', kind: 'browser', x: 0, y: 440 },
  { id: 'login', kind: 'browser', x: 0, y: 520 },

  { id: 'salt', kind: 'server', x: 200, y: 0 },
  { id: 'kdfParams', kind: 'server', x: 200, y: 80 },
  { id: 'vaultKey', kind: 'browser', x: 200, y: 180 },
  { id: 'nonce', kind: 'browser', x: 200, y: 260 },
  { id: 'context', kind: 'browser', x: 200, y: 340 },

  // Deriving the master key
  { id: 'argon2', kind: 'step', x: 400, y: 40,
    docs: [{ title: 'RFC 9106: Argon2', url: 'https://www.rfc-editor.org/rfc/rfc9106' }] },
  { id: 'masterKey', kind: 'browser', x: 600, y: 40 },

  // Encrypting
  { id: 'wrap', kind: 'step', x: 800, y: 220,
    docs: [AES_GCM_SPEC, WEBCRYPTO_ENCRYPT] },
  { id: 'encrypt', kind: 'step', x: 800, y: 440,
    docs: [AES_GCM_SPEC, WEBCRYPTO_ENCRYPT] },

  // What the server stores
  { id: 'verifier', kind: 'server', x: 1000, y: 40 },
  { id: 'wrappedKey', kind: 'server', x: 1000, y: 220 },
  { id: 'nameEnc', kind: 'server', x: 1000, y: 400 },
  { id: 'dataEnc', kind: 'server', x: 1000, y: 480 },

  // Unlocking
  { id: 'unwrap', kind: 'step', x: 1200, y: 130,
    docs: [AES_GCM_SPEC, WEBCRYPTO_DECRYPT] },
  { id: 'decrypt', kind: 'step', x: 1200, y: 440,
    docs: [AES_GCM_SPEC, WEBCRYPTO_DECRYPT] },
  { id: 'onScreen', kind: 'browser', x: 1400, y: 440 },
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
  { id: 'password', kind: 'browser', x: 0, y: 0 },
  { id: 'salt', kind: 'server', x: 0, y: 100 },
  { id: 'makeKey', kind: 'step', x: 200, y: 50 },
  { id: 'masterKey', kind: 'browser', x: 400, y: 50 },
  { id: 'vaultKeys', kind: 'browser', x: 600, y: 50 },
  { id: 'logins', kind: 'browser', x: 600, y: 200 },
  { id: 'lock', kind: 'step', x: 800, y: 200 },
  { id: 'server', kind: 'server', x: 1000, y: 200 },
  { id: 'unlock', kind: 'step', x: 1200, y: 120 },
  { id: 'onScreen', kind: 'browser', x: 1400, y: 120 },
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

/**
 * The tabs of the "How it works" panel, in order. Each tab's name, legend and node texts are in
 * src/i18n/<language>/HowItWorks.js, under the same id.
 */
export const diagrams = [
  { id: 'simple', nodes: simpleNodes, connections: simpleConnections },
  { id: 'technical', nodes: technicalNodes, connections: technicalConnections },
];
