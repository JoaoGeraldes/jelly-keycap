/**
 * All cryptography in the app. Nothing secret leaves the browser unencrypted.
 *
 *  - Argon2id (via hash-wasm) turns the master password into the master key.
 *    It is deliberately slow and memory-hungry, which makes guessing passwords expensive.
 *  - AES-256-GCM (built into every browser as WebCrypto) encrypts everything else.
 *    GCM also authenticates: tampered or swapped data fails to decrypt instead of
 *    decrypting to garbage.
 *
 * Encrypted values travel and are stored as one base64 string: nonce (12 bytes) + ciphertext.
 */
import { argon2id } from 'hash-wasm';

const NONCE_LENGTH = 12;
const KEY_LENGTH = 32;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/** Argon2id settings for new installations: 64 MiB of memory, 3 passes (OWASP's recommendation). */
export const DEFAULT_KDF_PARAMS = { algorithm: 'argon2id', memoryKiB: 65536, iterations: 3, parallelism: 1 };

export function randomBytes(length) {
  return crypto.getRandomValues(new Uint8Array(length));
}

/** A fresh random key, returned both raw (for wrapping) and ready to use. */
export async function generateKey() {
  const rawKey = randomBytes(KEY_LENGTH);
  return { rawKey, key: await importKey(rawKey) };
}

/** Turns raw key bytes into a WebCrypto key that can encrypt but can never be read back out. */
export function importKey(rawKey) {
  return crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function deriveMasterKey(password, salt, kdfParams) {
  const rawKey = await argon2id({
    password,
    salt,
    memorySize: kdfParams.memoryKiB,
    iterations: kdfParams.iterations,
    parallelism: kdfParams.parallelism,
    hashLength: KEY_LENGTH,
    outputType: 'binary',
  });
  return importKey(rawKey);
}

/**
 * Encrypts bytes. `context` names what the data is (for example "item:<id>") and must be
 * given again to decrypt. That binds the ciphertext to its row, so someone editing the
 * database cannot move one item's encrypted data onto another.
 */
export async function encryptBytes(key, plaintext, context) {
  const nonce = randomBytes(NONCE_LENGTH);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce, additionalData: textEncoder.encode(context) },
    key,
    plaintext,
  );
  return toBase64(new Uint8Array([...nonce, ...new Uint8Array(ciphertext)]));
}

/** Reverses encryptBytes. Throws if the key or context is wrong, or the data was changed. */
export async function decryptBytes(key, encrypted, context) {
  const bytes = fromBase64(encrypted);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytes.slice(0, NONCE_LENGTH), additionalData: textEncoder.encode(context) },
    key,
    bytes.slice(NONCE_LENGTH),
  );
  return new Uint8Array(plaintext);
}

export function encryptJson(key, value, context) {
  return encryptBytes(key, textEncoder.encode(JSON.stringify(value)), context);
}

export async function decryptJson(key, encrypted, context) {
  return JSON.parse(textDecoder.decode(await decryptBytes(key, encrypted, context)));
}

// 64 characters, so each random byte maps to one character with `& 63` and no bias.
// Look-alike characters (I, O, l, 0, 1) are left out to make passwords easy to read aloud.
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*-';

export function generatePassword(length = 20) {
  return Array.from(randomBytes(length), (byte) => PASSWORD_ALPHABET[byte & 63]).join('');
}

export function toBase64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function fromBase64(text) {
  return Uint8Array.from(atob(text), (character) => character.charCodeAt(0));
}
