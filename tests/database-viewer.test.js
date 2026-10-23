import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { openWindow, startEmptyServer } from './support/browser.js';

let server;
let window;
beforeEach(async () => {
  server = await startEmptyServer();
  window = await openWindow();
  await window.createMasterPassword('correct horse battery staple');
});
afterEach(() => server.stop());

const getJson = async (path) => (await fetch(`/api/${path}`)).json();

test('lists every table with its number of rows', async () => {
  assert.deepEqual(await getJson('tables'), [
    { name: 'items', rowCount: 0 },
    { name: 'key_derivation', rowCount: 1 },
    { name: 'user_settings', rowCount: 1 },
    { name: 'vaults', rowCount: 1 },
  ]);
});

test('shows every column and value exactly as stored', async () => {
  await window.saveItem({ ...window.newItem(window.session.vaults[0].id), title: 'GitHub' });
  const [storedItem] = await getJson('items');

  const table = await getJson('tables/items');

  assert.deepEqual(table.columns, ['id', 'vault_id', 'type', 'data_enc', 'created_at', 'updated_at']);
  assert.equal(table.rows.length, 1);
  assert.equal(table.rows[0].data_enc, storedItem.dataEnc);
  assert.equal(typeof table.rows[0].created_at, 'number');
});

test('splits rows into pages', async () => {
  const { pageSize } = await getJson('tables/items');
  for (let count = 0; count <= pageSize; count++) {
    await window.saveItem({ ...window.newItem(window.session.vaults[0].id), title: `Login ${count}` });
  }

  const firstPage = await getJson('tables/items?page=1');
  const secondPage = await getJson('tables/items?page=2');

  assert.equal(firstPage.rows.length, pageSize);
  assert.equal(secondPage.rows.length, 1);
  assert.equal(firstPage.pageCount, 2);
  assert.equal(firstPage.rowCount, pageSize + 1);
});

test('a table that does not exist is refused', async () => {
  for (const name of ['passwords', 'sqlite_schema', 'items";DROP TABLE items;--']) {
    const response = await fetch(`/api/tables/${encodeURIComponent(name)}`);
    assert.equal(response.status, 404, name);
  }
  assert.equal((await getJson('tables')).length, 4);
});

test('the viewer cannot change anything', async () => {
  for (const method of ['POST', 'PUT', 'DELETE']) {
    const response = await fetch('/api/tables/items', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method === 'DELETE' ? undefined : '{}',
    });
    assert.equal(response.status, 404, method);
  }
});
