/**
 * Talks to the server. Every value sent here is already encrypted (see vault.svelte.js),
 * and the routes mirror server/api.js one to one.
 */

async function request(method, path, body) {
  const response = await fetch(`/api/${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error), { status: response.status });
  return result;
}

export const api = {
  getKeyDerivation: () => request('GET', 'key-derivation'),
  createKeyDerivation: (keyDerivation) => request('POST', 'key-derivation', keyDerivation),
  changeMasterPassword: (change) => request('POST', 'change-master-password', change),

  listVaults: () => request('GET', 'vaults'),
  saveVault: (id, vault) => request('PUT', `vaults/${id}`, vault),
  deleteVault: (id) => request('DELETE', `vaults/${id}`),

  listItems: () => request('GET', 'items'),
  saveItem: (id, item) => request('PUT', `items/${id}`, item),
  deleteItem: (id) => request('DELETE', `items/${id}`),

  listTables: () => request('GET', 'tables'),
  readTable: (name, page) => request('GET', `tables/${encodeURIComponent(name)}?page=${page}`),

  getDatabaseFile: () => request('GET', 'database-file'),
  restoreBackup: (backup) => request('POST', 'restore', { backup }),
};

export const BACKUP_URL = '/api/backup';
