/**
 * The whole backend API: a thin layer that stores and returns encrypted text.
 *
 * The server never receives a password or a key. Every secret arrives already
 * encrypted by the browser (see src/lib/crypto.js), so this file only moves
 * values in and out of SQLite.
 *
 * Routes (all JSON unless noted):
 *   GET    /api/key-derivation          → the master-key settings, or null before first setup
 *   POST   /api/key-derivation          → store them once, on first setup
 *   POST   /api/change-master-password  → swap the master password, all or nothing
 *   GET    /api/vaults                  → every vault
 *   PUT    /api/vaults/:id              → create or update a vault
 *   DELETE /api/vaults/:id              → delete a vault and all of its items
 *   GET    /api/items                   → every item
 *   PUT    /api/items/:id               → create or update an item
 *   DELETE /api/items/:id               → delete an item
 *   GET    /api/backup                  → download a copy of the database file
 *   POST   /api/restore                 → replace everything with a backup (current vault saved first)
 *   GET    /api/database-file           → where the database file is, and its size
 *   GET    /api/tables                  → every table, with its number of rows (read-only viewer)
 *   GET    /api/tables/:name?page=1     → one page of a table, every column exactly as stored
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

export const DEFAULT_DATABASE_PATH = process.env.VAULT_DATABASE ?? 'vault.sqlite';

const SCHEMA = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
const TABLE_PAGE_SIZE = 50;
const NOT_A_BACKUP = 'This file isn’t a Vault backup, so nothing was changed.';

/** Opens (or creates) the database and returns the handler for every /api/ request. */
export function createApiHandler(databasePath) {
  const database = new DatabaseSync(databasePath);
  database.exec(SCHEMA);
  const isInMemory = databasePath === ':memory:'; // used by the tests
  const absolutePath = isInMemory ? databasePath : resolve(databasePath);

  // A vault key is wrapped with the master key, and the salt identifies which master key that is.
  // If the password was changed in another window, this window's master key is out of date and
  // anything it wraps could never be unlocked again, so the write is refused.
  function requireCurrentMasterKey(masterKeySalt) {
    const current = database.prepare('SELECT salt FROM key_derivation').get();
    if (masterKeySalt !== current?.salt) {
      throw httpError(409, 'Your master password was changed in another window. Unlock again with the new one.');
    }
  }

  function listTableNames() {
    return database
      .prepare("SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all()
      .map((table) => table.name);
  }

  /** Opens a would-be backup on its own and checks it has a master password and the vault tables. */
  function checkIsBackup(path) {
    let backup;
    try {
      backup = new DatabaseSync(path, { readOnly: true });
      const { count } = backup.prepare('SELECT count(*) AS count FROM key_derivation').get();
      backup.prepare('SELECT id, wrapped_key, name_enc FROM vaults LIMIT 1').all();
      backup.prepare('SELECT id, vault_id, type, data_enc FROM items LIMIT 1').all();
      if (count !== 1) throw new Error();
    } catch {
      throw httpError(400, NOT_A_BACKUP);
    } finally {
      backup?.close();
    }
  }

  /** Saves a copy of the current database next to it, named with today's date and time. */
  function saveSafetyCopy() {
    // Local time, so the name matches the clock on this computer; milliseconds keep quick repeats unique.
    const now = new Date();
    const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
    const stamp = localTime.toISOString().slice(0, 23).replaceAll(':', '-'); // 2026-10-21T22-45-07.123
    const folder = isInMemory ? tmpdir() : dirname(absolutePath);
    const safetyCopyPath = join(folder, `vault-before-restore-${stamp}.sqlite`);
    database.prepare('VACUUM INTO ?').run(safetyCopyPath);
    return safetyCopyPath;
  }

  function inTransaction(work) {
    database.exec('BEGIN');
    try {
      work();
      database.exec('COMMIT');
    } catch (error) {
      database.exec('ROLLBACK');
      throw error;
    }
  }

  const routes = {
    'GET key-derivation': () =>
      database.prepare('SELECT kdf_params AS kdfParams, salt, verifier FROM key_derivation').get() ?? null,

    // id = 1 is the only allowed row, so a second setup fails instead of overwriting the first.
    'POST key-derivation': ({ body }) => {
      database
        .prepare('INSERT INTO key_derivation (id, kdf_params, salt, verifier, created_at) VALUES (1, ?, ?, ?, ?)')
        .run(body.kdfParams, body.salt, body.verifier, Date.now());
    },

    // Every vault key must be re-wrapped in the same transaction as the new settings. Otherwise a
    // failure halfway, or a vault the browser didn't know about, would stay locked to the old password.
    'POST change-master-password': ({ body }) =>
      inTransaction(() => {
        requireCurrentMasterKey(body.masterKeySalt);

        const vaultIds = database.prepare('SELECT id FROM vaults').all().map((vault) => vault.id);
        const rewrappedIds = Object.keys(body.rewrappedVaultKeys);
        if (rewrappedIds.length !== vaultIds.length || !vaultIds.every((id) => rewrappedIds.includes(id))) {
          throw httpError(409, 'A vault was added in another window during the change. Nothing was changed. Unlock and try again.');
        }

        const { kdfParams, salt, verifier } = body.newKeyDerivation;
        database.prepare('UPDATE key_derivation SET kdf_params = ?, salt = ?, verifier = ?').run(kdfParams, salt, verifier);
        const updateWrappedKey = database.prepare('UPDATE vaults SET wrapped_key = ?, updated_at = ? WHERE id = ?');
        for (const id of vaultIds) updateWrappedKey.run(body.rewrappedVaultKeys[id], Date.now(), id);
      }),

    'GET vaults': () =>
      database.prepare('SELECT id, wrapped_key AS wrappedKey, name_enc AS nameEnc FROM vaults ORDER BY created_at').all(),

    'PUT vaults/:id': ({ id, body }) => {
      requireCurrentMasterKey(body.masterKeySalt);
      database
        .prepare(
          `INSERT INTO vaults (id, wrapped_key, name_enc, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
           ON CONFLICT (id) DO UPDATE SET
             wrapped_key = excluded.wrapped_key, name_enc = excluded.name_enc, updated_at = excluded.updated_at`,
        )
        .run(id, body.wrappedKey, body.nameEnc, Date.now(), Date.now());
    },

    'DELETE vaults/:id': ({ id }) => {
      database.prepare('DELETE FROM vaults WHERE id = ?').run(id);
    },

    'GET items': () =>
      database.prepare('SELECT id, vault_id AS vaultId, type, data_enc AS dataEnc FROM items').all(),

    'PUT items/:id': ({ id, body }) => {
      database
        .prepare(
          `INSERT INTO items (id, vault_id, type, data_enc, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT (id) DO UPDATE SET
             vault_id = excluded.vault_id, type = excluded.type, data_enc = excluded.data_enc, updated_at = excluded.updated_at`,
        )
        .run(id, body.vaultId, body.type, body.dataEnc, Date.now(), Date.now());
    },

    'DELETE items/:id': ({ id }) => {
      database.prepare('DELETE FROM items WHERE id = ?').run(id);
    },

    'GET tables': () =>
      listTableNames().map((name) => ({
        name,
        rowCount: database.prepare(`SELECT count(*) AS count FROM "${name}"`).get().count,
      })),

    // The name is checked against the real tables before it goes into the SQL, so it can't inject anything.
    'GET tables/:id': ({ id: name, query }) => {
      if (!listTableNames().includes(name)) throw httpError(404, `There is no table called "${name}"`);
      const page = Math.max(1, Number(query.get('page')) || 1);
      const rowCount = database.prepare(`SELECT count(*) AS count FROM "${name}"`).get().count;
      return {
        columns: database.prepare('SELECT name FROM pragma_table_info(?)').all(name).map((column) => column.name),
        rows: database
          .prepare(`SELECT * FROM "${name}" ORDER BY rowid LIMIT ? OFFSET ?`)
          .all(TABLE_PAGE_SIZE, (page - 1) * TABLE_PAGE_SIZE),
        page,
        pageSize: TABLE_PAGE_SIZE,
        pageCount: Math.max(1, Math.ceil(rowCount / TABLE_PAGE_SIZE)),
        rowCount,
      };
    },

    'GET database-file': () => ({
      path: absolutePath,
      sizeBytes: isInMemory ? 0 : statSync(absolutePath).size,
    }),

    // The backup is checked and the current vault saved before anything changes, and the swap
    // itself is one transaction, so a wrong file or a failure halfway leaves everything as it was.
    'POST restore': ({ body }) => {
      const uploadPath = join(tmpdir(), `vault-upload-${Date.now()}.sqlite`);
      writeFileSync(uploadPath, Buffer.from(body.backup, 'base64'));
      try {
        checkIsBackup(uploadPath);
        const safetyCopyPath = saveSafetyCopy();
        database.prepare('ATTACH DATABASE ? AS backup').run(uploadPath);
        try {
          inTransaction(() =>
            database.exec(`
              DELETE FROM items;
              DELETE FROM vaults;
              DELETE FROM key_derivation;
              INSERT INTO key_derivation (id, kdf_params, salt, verifier, created_at)
                SELECT id, kdf_params, salt, verifier, created_at FROM backup.key_derivation;
              INSERT INTO vaults (id, wrapped_key, name_enc, created_at, updated_at)
                SELECT id, wrapped_key, name_enc, created_at, updated_at FROM backup.vaults;
              INSERT INTO items (id, vault_id, type, data_enc, created_at, updated_at)
                SELECT id, vault_id, type, data_enc, created_at, updated_at FROM backup.items;
            `),
          );
        } finally {
          database.exec('DETACH DATABASE backup');
        }
        return { safetyCopyPath };
      } finally {
        rmSync(uploadPath);
      }
    },

    // VACUUM INTO writes a clean, consistent copy of the database, even while it is in use.
    'GET backup': () => {
      const copyPath = join(tmpdir(), `vault-backup-${Date.now()}.sqlite`);
      database.prepare('VACUUM INTO ?').run(copyPath);
      const copy = readFileSync(copyPath);
      rmSync(copyPath);
      return copy;
    },
  };

  async function handleApiRequest(request, response) {
    const url = new URL(request.url, 'http://localhost');
    const [collection, id] = url.pathname.slice('/api/'.length).split('/');
    const route = routes[`${request.method} ${collection}${id ? '/:id' : ''}`];
    if (!route) return sendJson(response, 404, { error: 'Unknown API route' });

    try {
      const body = ['POST', 'PUT'].includes(request.method) ? await readJsonBody(request) : undefined;
      const result = route({ id, body, query: url.searchParams });
      if (result instanceof Uint8Array) return sendDatabaseFile(response, result);
      sendJson(response, 200, result ?? null);
    } catch (error) {
      sendJson(response, error.status ?? 400, { error: error.message });
    }
  }

  handleApiRequest.closeDatabase = () => database.close(); // lets tests delete their temporary files
  return handleApiRequest;
}

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

// Requiring application/json makes any cross-site write trigger a CORS preflight, which this
// server never approves. That stops other websites from writing to your vault through your browser.
async function readJsonBody(request) {
  if (request.headers['content-type'] !== 'application/json') throw new Error('Expected a JSON body');
  let text = '';
  for await (const chunk of request) text += chunk;
  return JSON.parse(text);
}

function sendJson(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(value));
}

function sendDatabaseFile(response, bytes) {
  const today = new Date().toISOString().slice(0, 10);
  response
    .writeHead(200, {
      'Content-Type': 'application/vnd.sqlite3',
      'Content-Disposition': `attachment; filename="vault-backup-${today}.sqlite"`,
    })
    .end(bytes);
}
