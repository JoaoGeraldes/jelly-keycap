// Texts of src/components/HowItWorks.svelte, including the diagrams' nodes (by id, as in
// src/lib/how-it-works.js, which keeps their positions, arrows and documentation links).
import { DEFAULT_KDF_PARAMS } from '../../lib/crypto.js';

const { memoryKiB, iterations, parallelism } = DEFAULT_KDF_PARAMS;

export default {
  title: 'How it works',
  close: 'Close',
  levelOfDetail: 'Level of detail',
  simple: {
    name: 'Simple',
    legend: { browser: 'Only on your device', server: 'Kept on the server', step: 'Locking or unlocking' },
    nodes: {
      password: {
        title: 'Your master password',
        note: 'The one password you remember. It never leaves your device, and nobody can reset it for you, so keep it somewhere safe.',
      },
      salt: {
        title: 'A random ingredient',
        note: 'Made once when you set up, and kept with your vault (its technical name is “salt”). It isn’t secret. It makes your key unique, even if someone else picks the same password.',
      },
      makeKey: {
        title: 'Slowly make a key',
        note: 'Your password and the ingredient are mixed into a key. This is deliberately slow: barely noticeable for you, but it makes trying millions of guessed passwords take far too long.',
      },
      masterKey: {
        title: 'Your master key',
        note: 'Exists only while your vault is unlocked. Locking, or closing the tab, throws it away.',
      },
      vaultKeys: {
        title: 'A key for each vault',
        note: 'Every vault has its own random key, and your master key locks them all. Changing your master password only re-locks these keys.',
      },
      logins: { title: 'Your logins', note: 'Usernames, passwords, websites and notes, as you type them.' },
      lock: {
        title: 'Lock',
        note: 'Your logins are scrambled with the vault’s key on your device, before anything is sent. Scrambled, they look like random letters.',
      },
      server: {
        title: 'The server',
        note: 'Keeps only scrambled data. Someone who copies the whole file still can’t read a single password without your master password.',
      },
      unlock: {
        title: 'Unlock',
        note: 'When you unlock, your device downloads the scrambled data and unscrambles it itself, with your keys.',
      },
      onScreen: { title: 'On your screen', note: 'Your logins, readable again, only on your device and only while unlocked.' },
    },
  },
  technical: {
    name: 'Technical',
    legend: { browser: 'Only in browser memory', server: 'Stored in the database', step: 'Algorithm' },
    nodes: {
      password: { title: 'Master password', note: 'Typed by you to unlock. Never stored and never sent to the server.' },
      random: {
        title: 'Random generator',
        note: 'crypto.getRandomValues: the browser’s cryptographically secure random numbers.',
      },
      vaultName: { title: 'Vault name', note: 'The name you give a vault, like Work.' },
      login: { title: 'Login', note: 'Title, username, password, website and notes, together as one JSON object.' },
      salt: {
        title: 'Salt',
        note: '16 random bytes, stored in key_derivation.salt. Not secret. It makes the same password give a different key on every install, so attackers can’t reuse precomputed guesses. A new one is made when you change the password.',
      },
      kdfParams: {
        title: 'Argon2id settings',
        note: `${memoryKiB / 1024} MiB of memory, ${iterations} passes, ${parallelism} lane. Stored in key_derivation.kdf_params, so they can be made stronger later without breaking old vaults.`,
      },
      vaultKey: {
        title: 'Vault key',
        note: 'A random 256-bit key, one per vault. It encrypts that vault’s name and logins. Changing the master password only re-wraps this key; no login is re-encrypted.',
      },
      nonce: {
        title: 'Nonce',
        note: '12 random bytes, new for every encryption, stored in front of the ciphertext. The same data never encrypts the same way twice.',
      },
      context: {
        title: 'Context',
        note: 'Names the row the data belongs to, like item:<id>. Not secret and not stored, but it must match to decrypt, so ciphertext can’t be moved to another row.',
      },
      argon2: {
        title: 'Argon2id',
        note: 'A deliberately slow, memory-hungry hash. Turns password + salt into a key, and makes every guess at your password cost the same time and memory.',
      },
      masterKey: {
        title: 'Master key',
        note: 'The 256-bit key Argon2id produces. Kept only in memory while unlocked. Its only job is to lock and unlock the vault keys.',
      },
      wrap: {
        title: 'Wrap: AES-256-GCM',
        note: 'Encrypts the vault key with the master key. GCM also adds a tag that detects any change to the data.',
      },
      encrypt: {
        title: 'Encrypt: AES-256-GCM',
        note: 'Encrypts vault names and logins with the vault key. Built into every browser (WebCrypto).',
      },
      verifier: {
        title: 'key_derivation.verifier',
        note: 'A fixed text encrypted with the master key. Unlocking tries to decrypt it: if that works, the password is right.',
      },
      wrappedKey: { title: 'vaults.wrapped_key', note: 'The vault key, encrypted, stored as base64(nonce + ciphertext).' },
      nameEnc: { title: 'vaults.name_enc', note: 'The vault name, encrypted.' },
      dataEnc: { title: 'items.data_enc', note: 'The login, encrypted. This is all the server ever sees of it.' },
      unwrap: {
        title: 'Unwrap: AES-256-GCM',
        note: 'On unlock, the master key decrypts each vault key. It fails if the password is wrong or the data was changed.',
      },
      decrypt: {
        title: 'Decrypt: AES-256-GCM',
        note: 'The vault key decrypts names and logins. The GCM tag is checked first, so changed data fails instead of showing garbage.',
      },
      onScreen: {
        title: 'On your screen',
        note: 'Your vaults and logins, readable only while unlocked. Locking or closing the tab forgets them and every key.',
      },
    },
  },
};
