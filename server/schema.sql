-- Jelly Keycap database schema.
--
-- Everything secret in this file is ciphertext produced in the browser
-- (see src/lib/crypto.js). Encrypted values are stored as base64 text in
-- the form  base64(nonce || ciphertext)  so the server can pass them through
-- untouched, without any binary conversion code.
--
-- Runs on every server start; IF NOT EXISTS makes that safe.

PRAGMA foreign_keys = ON;

-- One row only. Describes how to turn the master password into the master key.
-- The password itself and the master key are never stored anywhere.
CREATE TABLE IF NOT EXISTS key_derivation (
  id          INTEGER PRIMARY KEY CHECK (id = 1),
  kdf_params  TEXT    NOT NULL,  -- JSON, e.g. {"algorithm":"argon2id","memoryKiB":65536,"iterations":3,"parallelism":1}
  salt        TEXT    NOT NULL,  -- base64, random per installation
  verifier    TEXT    NOT NULL,  -- a known text encrypted with the master key; decrypting it proves the password is right
  created_at  INTEGER NOT NULL   -- Unix time in milliseconds
);

-- A vault is a named group of items ("Personal", "Work", ...).
-- Each vault has its own random key, stored encrypted ("wrapped") with the master key.
CREATE TABLE IF NOT EXISTS vaults (
  id           TEXT    PRIMARY KEY,  -- UUID generated in the browser
  wrapped_key  TEXT    NOT NULL,     -- the vault key, encrypted with the master key
  name_enc     TEXT    NOT NULL,     -- the vault name, encrypted with the vault key
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);

-- An item is one saved secret: a login today, other types later.
-- All of its fields (title, username, password, url, notes) live inside data_enc.
CREATE TABLE IF NOT EXISTS items (
  id          TEXT    PRIMARY KEY,  -- UUID generated in the browser
  vault_id    TEXT    NOT NULL REFERENCES vaults (id) ON DELETE CASCADE,
  type        TEXT    NOT NULL,     -- 'login' for now; visible in plaintext for filtering
  data_enc    TEXT    NOT NULL,     -- JSON of the item's fields, encrypted with the vault key
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS items_by_vault ON items (vault_id);

-- One row only. The person's settings, kept here so they are the same in every browser and in
-- the desktop app. Plain text: none of it is secret, and the language is needed on the lock
-- screen, before anything can be decrypted. NULL means not chosen yet, so the app's default is used.
CREATE TABLE IF NOT EXISTS user_settings (
  id                 INTEGER PRIMARY KEY CHECK (id = 1),
  theme              TEXT,     -- 'light' or 'dark'
  text_scale         REAL,     -- 1 is normal size, 1.2 is 20% bigger
  language           TEXT,     -- 'en' or 'pt'
  auto_lock_minutes  INTEGER   -- minutes without activity before the vault locks itself
);

-- The row is there from the start, so reading and saving never have to check for it.
INSERT OR IGNORE INTO user_settings (id) VALUES (1);
