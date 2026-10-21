import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createVaultServer } from '../server/server.js';

// A temporary folder with a fake built UI, and a secret file just outside it.
const folder = mkdtempSync(join(tmpdir(), 'vault-test-'));
mkdirSync(join(folder, 'ui'));
writeFileSync(join(folder, 'ui', 'index.html'), 'the app');
writeFileSync(join(folder, 'secret.txt'), 'outside the UI folder');

let server;
before(async () => {
  server = createVaultServer({
    databasePath: ':memory:',
    uiFolder: pathToFileURL(join(folder, 'ui') + '/'),
    allowedHostnames: ['127.0.0.1'],
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
});
after(() => {
  server.close();
  rmSync(folder, { recursive: true });
});

/** Sends a raw HTTP request. Unlike fetch, it keeps the path and Host header exactly as given. */
function send({ method = 'GET', path, headers = {}, body }) {
  return new Promise((resolve, reject) => {
    const outgoing = request({ host: '127.0.0.1', port: server.address().port, method, path, headers }, (response) => {
      let text = '';
      response.on('data', (chunk) => (text += chunk));
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: text }));
    });
    outgoing.on('error', reject);
    outgoing.end(body);
  });
}

test('pages are sent with a strict Content-Security-Policy', async () => {
  const response = await send({ path: '/' });

  assert.equal(response.body, 'the app');
  assert.match(response.headers['content-security-policy'], /default-src 'self'/);
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
});

test('requests for an unknown host name are refused (DNS rebinding)', async () => {
  const response = await send({ path: '/api/vaults', headers: { Host: 'evil.example' } });

  assert.equal(response.status, 403);
});

test('files outside the UI folder cannot be read', async () => {
  for (const path of ['/../secret.txt', '/%2e%2e/secret.txt', '/..%2fsecret.txt']) {
    const response = await send({ path });
    assert.notEqual(response.body, 'outside the UI folder', `${path} leaked the file`);
  }
});

test('API writes that are not JSON are refused (blocks cross-site form posts)', async () => {
  const response = await send({
    method: 'POST',
    path: '/api/key-derivation',
    headers: { 'Content-Type': 'text/plain' },
    body: '{}',
  });

  assert.equal(response.status, 400);
});

test('unknown API routes return 404', async () => {
  const response = await send({ path: '/api/does-not-exist' });

  assert.equal(response.status, 404);
});
