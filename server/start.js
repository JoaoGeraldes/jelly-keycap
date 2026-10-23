/**
 * Starts the production server (`npm start`). Build the UI first with `npm run build`.
 *
 * Settings (environment variables):
 *   HOST               address to listen on            (default 127.0.0.1, this computer only)
 *   PORT               port to listen on               (default 3000)
 *   ALLOWED_HOSTNAMES  names the browser may use to reach the server (default localhost,127.0.0.1)
 *   VAULT_DATABASE     path to the SQLite file         (default vault.sqlite)
 */
import { existsSync } from "node:fs";
import { DEFAULT_DATABASE_PATH } from "./api.js";
import { createVaultServer } from "./server.js";

const HOST = process.env.HOST ?? "127.0.0.1";
const PORT = Number(process.env.PORT ?? 3000);
const UI_FOLDER = new URL("../dist/", import.meta.url);

if (!existsSync(new URL("index.html", UI_FOLDER))) {
  console.error("The UI is not built yet. Run `npm run build` first.");
  process.exit(1);
}

createVaultServer({
  databasePath: DEFAULT_DATABASE_PATH,
  uiFolder: UI_FOLDER,
  allowedHostnames: (
    process.env.ALLOWED_HOSTNAMES ?? "localhost,127.0.0.1"
  ).split(","),
}).listen(PORT, HOST, () => {
  console.log(
    `Jelly Keycap is running at http://${HOST}:${PORT} (database: ${DEFAULT_DATABASE_PATH})`,
  );
});
