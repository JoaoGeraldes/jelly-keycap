<img src="src/media/logo-symbol.svg" alt="" width="72" />

# Vault

A minimal, self-hosted password manager. One Node process, one SQLite file, a Svelte UI, and
encryption that happens entirely in your browser.

The goal is the least code that is still correct: no backend dependencies, and one runtime
dependency in the browser (Argon2).

- [Quick start](#quick-start)
- [Desktop app](#desktop-app)
- [How it works](#how-it-works)
- [Encryption](#encryption)
- [Database](#database)
- [API](#api)
- [Backup and restore](#backup-and-restore)
- [Configuration](#configuration)
- [Security notes](#security-notes)
- [Translations](#translations)
- [Tests](#tests)
- [Project layout](#project-layout)
- [Not built yet](#not-built-yet)
- [License](#license)

## Quick start

Requires Node.js 22.13 or newer, which includes SQLite as `node:sqlite`.

```sh
npm install
npm run dev        # development: http://localhost:5173, with hot reload
```

To run it for real:

```sh
npm run build      # builds the UI into dist/
npm start          # serves the UI and the API on http://127.0.0.1:3000
```

The first visit asks you to create a master password. Your vault is the file `vault.sqlite`
in the folder you started from.

## Desktop app

For everyday use there is nothing to set up: install Vault and open it like any other app. It
opens in its own window and runs everything it needs by itself, with no server to start and no
browser to open. Your vault is kept in the app's own folder (on Windows,
`%APPDATA%\Vault\vault.sqlite`), and **View database** shows the exact path.

For developers, the desktop app is a thin shell around the same code. All of it is in
[`desktop/main.js`](desktop/main.js): it starts `server/server.js` on a free port that only this
computer can reach, and opens a window on it. Nothing else in the project knows about Electron.

```sh
npm run desktop    # builds the UI and opens the desktop app
npm run package    # builds an installer for this system into release/
```

The installer isn't code-signed, so on first launch Windows shows "Windows protected your PC"
(choose **More info → Run anyway**), and macOS asks you to right-click the app and choose **Open**.

## How it works

```
 Browser                                         Server (Node)            Disk
┌──────────────────────────────────────┐        ┌─────────────────┐      ┌──────────────┐
│ Svelte UI                            │        │ server/api.js   │      │ vault.sqlite │
│   └─ vault.svelte.js  encrypts and   │  JSON  │ stores and      │ SQL  │ ciphertext   │
│      decrypts everything ──crypto.js │ ─────▶ │ returns opaque  │ ───▶ │ only         │
│      keys exist only in memory       │        │ text, nothing   │      │              │
└──────────────────────────────────────┘        │ else            │      └──────────────┘
                                                └─────────────────┘
```

The server is deliberately unaware of what it stores. It never receives your master
password or any key, so a copy of the database, or a compromised server, reveals no secrets.
It also keeps the backend tiny: almost every route is a single SQL statement.

The browser code has three layers, each of which only talks to the one below it:

| File | Knows about | Job |
| --- | --- | --- |
| `src/screens/*`, `src/components/*` | plain objects | Show things and react to clicks |
| `src/lib/vault.svelte.js` | keys, the API | Encrypt on the way out, decrypt on the way in, hold the session |
| `src/lib/crypto.js` | bytes | Argon2id, AES-GCM, base64, password generator |
| `src/lib/api.js` | HTTP | One function per server route |

## Encryption

```
master password ──Argon2id──▶ master key ──unwraps──▶ vault key (one per vault) ──decrypts──▶ items
                  (salt from                          (stored encrypted in
                   key_derivation)                     vaults.wrapped_key)
```

- **Master key.** Derived from your password with Argon2id: 64 MiB of memory and 3 passes,
  following OWASP's recommendation. It is never stored. The settings and a random salt are
  stored in `key_derivation`, so they can be strengthened later without breaking old vaults.
- **Checking the password.** `key_derivation.verifier` is a fixed text encrypted with the
  master key. If it decrypts, the password is right. This works even before any vault exists.
- **Vault keys.** Each vault gets its own random 256-bit key, stored encrypted ("wrapped")
  with the master key. This means:
  - changing the master password only re-encrypts the vault keys, not every item;
  - one vault can later be exported or shared without exposing the others.
- **Items and vault names.** Encrypted with AES-256-GCM using the vault's key. All item fields
  (title, username, password, website, notes) go into one encrypted JSON blob, so search
  happens in the browser after unlocking.
- **Format.** Every encrypted value is `base64(12-byte random nonce || ciphertext)`.
- **Binding to the row.** Each encryption carries a context string as associated data:
  `verifier`, `vault-key:<id>`, `vault-name:<id>` or `item:<id>`. Copying one row's
  ciphertext onto another row makes decryption fail instead of quietly showing the wrong data.
- **Locking.** Keys exist only in JavaScript memory. Lock, reload or close the tab, and they
  are gone.

### Changing the master password

Items are not touched. The browser derives a new master key (with a new salt), re-wraps every
vault key with it, and sends it all in one request. The server saves it in a single transaction,
so either everything changes or nothing does. Two checks make sure no vault ends up locked to
the old password:

- **Every vault must be included.** The browser re-wraps the server's list of vaults, not its
  own, and the server refuses the change if any vault is missing (one added in another window
  meanwhile, for example).
- **Outdated windows can't write vault keys.** Every vault write carries the salt of the master
  key it was made with. After a change, another window still holding the old key gets a
  `409` and locks itself, asking for the new password.

Changing the password does not replace the vault keys. Someone with an old backup and the old
password could still read vaults that exist in both. Replacing the vault keys too, for when a
password has leaked, is not built yet.

AES-GCM is built into every browser (WebCrypto), so the only crypto dependency is Argon2,
via [hash-wasm](https://github.com/Daninet/hash-wasm).

**How it works** in the app draws all of this as a diagram you can drag around, with a note on
each step when you hover it. It has two tabs: **Simple**, in everyday words with fewer steps,
and **Technical**, with every algorithm linked to its official documentation. Its shape (nodes, arrows, documentation links) lives in `src/lib/how-it-works.js`, and its words in `src/i18n/<language>/HowItWorks.js`.

## Database

The full schema with comments is in [`server/schema.sql`](server/schema.sql). It runs on
every start (`CREATE TABLE IF NOT EXISTS`), so a new install needs no setup step.

| Table | One row per | Plaintext columns | Encrypted columns |
| --- | --- | --- | --- |
| `key_derivation` | installation (always exactly one) | `kdf_params`, `salt`, `created_at` | `verifier` |
| `vaults` | vault | `id`, timestamps | `wrapped_key`, `name_enc` |
| `items` | saved login | `id`, `vault_id`, `type`, timestamps | `data_enc` |

Encrypted values are stored as base64 text rather than BLOBs. That costs about a third more
space but lets the server pass values straight through with no conversion code.

Deleting a vault deletes its items too (`ON DELETE CASCADE`).

**View database** in the app shows every table, column and value exactly as stored, read-only
and 50 rows per page. Dates (`*_at` columns) are shown in your own language and time zone; pointing
at one shows the stored value. It's a quick way to check for yourself that nothing secret is readable.

**Deleting an entry** hides it at once but only deletes it from the file after 5 seconds, so
the note in the corner can bring it back. Locking, closing or reloading the app before then keeps
the entry. This is the only thing that waits; everything else is saved immediately.

**What someone with only the file can see:** how many vaults and items exist, which item is
in which vault, item types, and when things were created or changed. Nothing else.

## API

Implemented in [`server/api.js`](server/api.js). It's JSON in and out. Errors come back as
`{ "error": "message" }` with status 400, 404, or 409 (made with an outdated master key).

| Method and path | Body | Returns |
| --- | --- | --- |
| `GET /api/key-derivation` | | `{ kdfParams, salt, verifier }`, or `null` before first setup |
| `POST /api/key-derivation` | `{ kdfParams, salt, verifier }` | `null`; fails if already set up |
| `POST /api/change-master-password` | `{ masterKeySalt, newKeyDerivation: { kdfParams, salt, verifier }, rewrappedVaultKeys: { [vaultId]: wrappedKey } }` | `null`; all or nothing |
| `GET /api/vaults` | | `[{ id, wrappedKey, nameEnc }]` |
| `PUT /api/vaults/:id` | `{ masterKeySalt, wrappedKey, nameEnc }` | `null`; creates or updates |
| `DELETE /api/vaults/:id` | | `null`; also deletes the vault's items |
| `GET /api/items` | | `[{ id, vaultId, type, dataEnc }]` |
| `PUT /api/items/:id` | `{ vaultId, type, dataEnc }` | `null`; creates or updates |
| `DELETE /api/items/:id` | | `null` |
| `GET /api/backup` | | The database file, as a download |
| `POST /api/restore` | `{ backup }` (the backup file, base64) | `{ safetyCopyPath }`; the current vault is saved there first |
| `GET /api/database-file` | | `{ path, sizeBytes }` of the database file |
| `GET /api/tables` | | `[{ name, rowCount }]` for every table |
| `GET /api/tables/:name?page=1` | | `{ columns, rows, page, pageSize, pageCount, rowCount }`, 50 rows per page |

IDs are UUIDs created in the browser, which is why creating and updating are the same `PUT`.

## Backup and restore

- **Backup:** open **View database** and click **Download backup**, or `GET /api/backup`. You get a complete,
  consistent copy of the database (made with SQLite's `VACUUM INTO`). It is already encrypted,
  so you can keep it in any cloud folder. Copying `vault.sqlite` while the server is stopped
  works just as well.
- **Restore:** in the app, open **View database** and use **Restore a backup** at the bottom. Before
  anything changes, the file is checked (a file that isn't a backup changes nothing) and your
  current vault is saved next to it as `vault-before-restore-<date and time>.sqlite`. The swap is a
  single transaction. Afterwards the app locks: unlock with the master password that was in use when
  the backup was made. To undo, restore the saved copy the same way.
  Without the app: stop the server, replace `vault.sqlite` with the backup, and start it again.
- **Where the file is:** **View database** shows the full path and size of the database file.

## Configuration

Set these as environment variables when running `npm start`:

| Variable | Default | Meaning |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Address to listen on. The default only accepts connections from this computer. |
| `PORT` | `3000` | Port to listen on |
| `ALLOWED_HOSTNAMES` | `localhost,127.0.0.1` | Comma-separated names the browser may use to reach the server, for example `vault.home.lan` |
| `VAULT_DATABASE` | `vault.sqlite` | Path to the database file |

**Text size and theme.** The bar at the top right has **A−** / **A+** (80% to 160%) and a light/dark
switch. Both are remembered in your browser; until you pick a theme, your system's is used.

**Look.** The faint grain over the app is set at the top of `src/app.css`: `--noise-opacity`
(0 turns it off), `--noise-size` and, inside `--noise-texture`, `baseFrequency` for how fine it is.

## Security notes

Please read these before putting this on a network.

- **Your master password cannot be recovered.** There is no reset by design. Forget it and
  the data is gone.
- **The server has no login.** Anyone who can reach it can download the encrypted data, or
  delete it. They still cannot read it without your master password. That's why the server only
  listens on `127.0.0.1` by default. To use it from other devices, put it behind a reverse proxy
  with HTTPS and access control (Caddy with basic auth, Tailscale, a VPN, and so on).
- **Deleting a vault and restoring a backup ask for the master password.** That stops someone at
  your unlocked screen. The check runs in the browser, so it does not replace access control on
  the server itself (see the point above). A restore always saves the current vault first.
  An empty vault is deleted without asking, since there is nothing in it to lose.
- **The database file's full path is shown** in the app (and by `GET /api/database-file`). On a
  shared server, that reveals the folder name, which may include a user name.
- **HTTPS is required anywhere except localhost.** Browsers only enable WebCrypto and the
  clipboard on secure origins, and your encrypted data should not travel in plain HTTP either.
- **Built-in protections:**
  - A strict Content-Security-Policy: the page only runs its own scripts.
  - Writes must be `application/json`, so other websites can't write to the API through your browser.
  - A Host check blocks DNS-rebinding attacks.
  - Website links always open as `http(s)`, never as `javascript:`.
- **Trust in the frontend.** Whoever controls the server controls the JavaScript it sends, and
  could in theory serve code that leaks your password. This is the same trade-off every web-based
  password manager makes. Self-hosting means that whoever is you.

## Translations

Each component's text has one file per language, named after the component:

```
src/i18n/en/ItemEditor.js     English, the reference
src/i18n/pt/ItemEditor.js     Portuguese (Portugal)
```

A component reads its texts with `const text = textFor('ItemEditor')`, then `{text.save}`. A text
that includes a value is a function: `` notSaved: (reason) => `Not saved: ${reason}` ``. Repeating
common words like "Cancel" in several files is on purpose: every file stands on its own.

- **Translating a component:** move its texts into `src/i18n/en/<Component>.js`, add the same
  keys to every other language, and list the file in each language's `index.js`.
- **Adding a language:** copy `src/i18n/en/`, translate it, and add it to `LANGUAGES` and
  `TRANSLATIONS` in `src/lib/i18n.svelte.js`.
- **Nothing gets forgotten:** `tests/i18n.test.js` fails if a language is missing a file or a
  text that English has. In the app, anything missing still shows in English.

The language is chosen in **Settings** and remembered in this browser; until then, the browser's
language is used. Every screen is translated. What isn't yet: error messages that come from
`src/lib/vault.svelte.js` or the server (like a wrong master password), which are still in English.

## Tests

```sh
npm test
```

They use Node's built-in test runner, so there's nothing extra to install. Browser code runs
against a real API server with a fresh in-memory database for each test, and real Argon2.

| File | Covers | Run it when you change |
| --- | --- | --- |
| `tests/crypto.test.js` | Encryption, key derivation, password generator | `src/lib/crypto.js` |
| `tests/master-password.test.js` | Creating, unlocking, locking, changing the master password | `vault.svelte.js`, `server/api.js`, `server/schema.sql`, `crypto.js` |
| `tests/vaults-and-logins.test.js` | Vaults, logins, nothing readable on the server, backup | `vault.svelte.js`, `server/api.js`, `server/schema.sql` |
| `tests/database-viewer.test.js` | Listing tables, every column shown, pages, unknown tables refused, read-only | `server/api.js`, `server/schema.sql` |
| `tests/how-it-works.test.js` | Both diagrams: every arrow joins two real nodes, no node left unconnected; Simple is smaller; every Technical algorithm linked to its docs | `src/lib/how-it-works.js`, `src/i18n/en/HowItWorks.js` |
| `tests/i18n.test.js` | Every language has every English text; texts follow the chosen language; English fills any gap | `src/lib/i18n.svelte.js`, `src/i18n/` |
| `tests/display-settings.test.js` | Text size steps and limits, defaults when nothing is saved | `src/lib/display-settings.js` |
| `tests/caps-lock.test.js` | Caps Lock warning turns on and off with key presses | `src/lib/caps-lock.svelte.js` |
| `tests/database-file.test.js` | File location; restoring a backup, the safety copy, wrong or damaged files, password check | `server/api.js`, `vault.svelte.js` |
| `tests/format.test.js` | Dates in the person's locale and time zone, other values as stored, file sizes | `src/lib/format.js` |
| `tests/web-server.test.js` | Security headers, Host check, file access, JSON-only writes | `server/server.js`, `server/api.js` |

To run one file:

```sh
node --disable-warning=ExperimentalWarning --import ./tests/support/setup.js --test tests/crypto.test.js
```

Helpers live in `tests/support/`. `openWindow()` gives each test its own copy of the app's
session, like a browser tab, so tests can check what happens with two windows open.

## Project layout

```
desktop/
  main.js               The desktop app (Electron): starts the server and opens it in a window
server/
  schema.sql            Database tables, with comments
  api.js                Every API route, plus the SQLite connection
  server.js             Production server: UI files, security headers, API
  start.js              Reads the settings and starts server.js (`npm start`)
src/
  main.js               Mounts the app
  App.svelte            Top bar, then the lock screen or the vault screen
  app.css               Color tokens for both themes (light is Tailwind's slate, dark follows VS Code's Dark Modern), base elements, buttons
  fonts/                Atkinson Hyperlegible Mono, the app's font, chosen for readability (SIL Open Font License)
  media/                The logo: SVG for the app and browser tab; PNG and .ico (with a hand-made 16px) for the desktop app
  lib/
    crypto.js           Argon2id, AES-GCM, base64, password generator
    api.js              One function per API route
    vault.svelte.js     Session state; encryption on the way out, decryption on the way in
    display-settings.js Text size and theme: load, apply, remember
    i18n.svelte.js      Translations: the chosen language, and textFor(component)
    format.js           How stored values are shown: local dates and times, file sizes
    caps-lock.svelte.js Whether Caps Lock is on, for the warning under password fields
    how-it-works.js     Shape of the "How it works" diagrams: nodes, positions, arrows, doc links
  screens/
    LockScreen.svelte   Create or enter the master password
    VaultScreen.svelte  Vaults, list of logins, and the selected login
  components/
    ItemEditor.svelte   View and edit one login
    Settings.svelte              Settings: the master password and language cards
    About.svelte                 About: the motto, who made it, the source code and how to contribute
    ChangeMasterPassword.svelte  The "Master password" card in Settings
    DisplaySettings.svelte       A− / A+ and the theme switch in the top bar
    CapsLockWarning.svelte       "Caps Lock is on" under every master password field
    JellyKeycap.svelte           The lock screen's jelly keycap: squashed by each keystroke (flatter when typing fast), can be thrown
    PinTumbler.svelte            Alternative lock screen toy (not shown): pins jump as you type, line up while unlocking
    DeleteVaultDialog.svelte     Asks for the master password before deleting a vault with logins in it
    DatabaseViewer.svelte        Where the file is, and a read-only view of every table, page by page
    RestoreBackup.svelte         Restore a backup (current vault saved first)
    HowItWorks.svelte            Draggable diagram of the encryption
    UndoStack.svelte             "Deleted · Undo" notes in the corner while a deleted entry can still come back
  i18n/
    en/, pt/            One text file per component, per language (see Translations)
tests/                  See Tests above
vite.config.js          Svelte build, and the API mounted inside the dev server
```

## Not built yet

Each of these fits the current design without changing it:

- **Import and export** from Bitwarden, 1Password, KeePass and browser CSV files.
- **Replacing vault keys** after a leaked password: re-encrypt every item with new vault keys.
- **Renaming vaults.** The API already supports it through `PUT /api/vaults/:id`.
- **Moving a login to another vault.** `saveItem` already re-encrypts with the right key;
  only the UI control is missing.
- **More item types**, such as notes, API keys, SSH keys and `.env` files. `items.type` is
  ready for them.
- **Comfort features:** auto-lock after inactivity, clearing the clipboard after copying, a trash for deleted entries.
- **A CLI** that reads the same file, for scripts and environment variables.
- **Schema migrations**, using SQLite's `PRAGMA user_version` once the schema first changes.

## License

[MIT](LICENSE) © 2026 João Geraldes. Contributions are welcome: open an
[issue](https://github.com/JoaoGeraldes/password-manager-2026/issues) or a pull request. Security problems:
please [report them privately](https://github.com/JoaoGeraldes/password-manager-2026/security/advisories/new).
