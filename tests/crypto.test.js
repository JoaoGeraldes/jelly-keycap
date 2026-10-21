import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_KDF_PARAMS,
  decryptJson,
  deriveMasterKey,
  encryptJson,
  fromBase64,
  generateKey,
  generatePassword,
  randomBytes,
  toBase64,
} from '../src/lib/crypto.js';

test('encrypted data decrypts back to the original', async () => {
  const { key } = await generateKey();
  const encrypted = await encryptJson(key, { password: 'hunter2' }, 'item:1');

  assert.deepEqual(await decryptJson(key, encrypted, 'item:1'), { password: 'hunter2' });
});

test('encrypting the same data twice gives different results', async () => {
  const { key } = await generateKey();

  assert.notEqual(await encryptJson(key, 'same', 'item:1'), await encryptJson(key, 'same', 'item:1'));
});

test('decrypting with the wrong key fails', async () => {
  const { key } = await generateKey();
  const { key: otherKey } = await generateKey();
  const encrypted = await encryptJson(key, 'secret', 'item:1');

  await assert.rejects(decryptJson(otherKey, encrypted, 'item:1'));
});

test('encrypted data copied onto another row fails to decrypt', async () => {
  const { key } = await generateKey();
  const encrypted = await encryptJson(key, 'secret', 'item:1');

  await assert.rejects(decryptJson(key, encrypted, 'item:2'));
});

test('encrypted data that was changed fails to decrypt', async () => {
  const { key } = await generateKey();
  const bytes = fromBase64(await encryptJson(key, 'secret', 'item:1'));
  bytes[bytes.length - 1] ^= 1; // flip one bit

  await assert.rejects(decryptJson(key, toBase64(bytes), 'item:1'));
});

test('the same password and salt always give the same master key', async () => {
  const salt = randomBytes(16);
  const firstKey = await deriveMasterKey('correct horse battery staple', salt, DEFAULT_KDF_PARAMS);
  const secondKey = await deriveMasterKey('correct horse battery staple', salt, DEFAULT_KDF_PARAMS);
  const encrypted = await encryptJson(firstKey, 'secret', 'test');

  assert.equal(await decryptJson(secondKey, encrypted, 'test'), 'secret');
});

test('a different password gives a different master key', async () => {
  const salt = randomBytes(16);
  const rightKey = await deriveMasterKey('correct horse battery staple', salt, DEFAULT_KDF_PARAMS);
  const wrongKey = await deriveMasterKey('correct horse battery stapler', salt, DEFAULT_KDF_PARAMS);
  const encrypted = await encryptJson(rightKey, 'secret', 'test');

  await assert.rejects(decryptJson(wrongKey, encrypted, 'test'));
});

test('generated passwords are 20 characters long, unique, and have no look-alike characters', () => {
  const passwords = Array.from({ length: 100 }, () => generatePassword());

  for (const password of passwords) {
    assert.equal(password.length, 20);
    assert.doesNotMatch(password, /[IOl01]/);
  }
  assert.equal(new Set(passwords).size, passwords.length);
});
