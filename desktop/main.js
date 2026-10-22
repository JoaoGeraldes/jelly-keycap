/**
 * The desktop app (Electron): Vault in its own window, with no server to start by hand.
 *
 * It runs the same server as `npm start` (server/server.js), on a free port only this computer
 * can reach, and keeps the vault in the app's own data folder (on Windows,
 * %APPDATA%\Vault\vault.sqlite). This is the only file in the project that knows about Electron.
 */
import { app, BrowserWindow, shell } from 'electron';
import { join } from 'node:path';
import { createVaultServer } from '../server/server.js';

const UI_FOLDER = new URL('../dist/', import.meta.url);

// A second copy would run a second server on the same file, so it focuses the first one instead.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.whenReady().then(openVault);
  app.on('window-all-closed', () => app.quit());
}

function openVault() {
  const server = createVaultServer({
    databasePath: join(app.getPath('userData'), 'vault.sqlite'),
    uiFolder: UI_FOLDER,
    allowedHostnames: ['127.0.0.1'],
  });

  // Port 0: the system picks a free port, so the app never clashes with anything already running.
  server.listen(0, '127.0.0.1', () => {
    const window = new BrowserWindow({ width: 1200, height: 800, autoHideMenuBar: true });

    // Links, like a login's website, open in the normal browser, never inside the app.
    window.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https?:\/\//.test(url)) shell.openExternal(url);
      return { action: 'deny' };
    });

    window.loadURL(`http://127.0.0.1:${server.address().port}`);
    app.on('second-instance', () => {
      window.restore();
      window.focus();
    });
  });
}
