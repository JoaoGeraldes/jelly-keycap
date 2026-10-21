// Helpers that let tests act like a browser talking to a real API server.
import { createServer } from 'node:http';
import { createApiHandler } from '../../server/api.js';

const realFetch = globalThis.fetch;

/**
 * Starts the API on a random port with a new, empty database (in memory unless a file path is
 * given), and points the app's fetch('/api/...') calls at it.
 * Returns the server's base URL and a function to stop it.
 */
export async function startEmptyServer({ databasePath = ':memory:' } = {}) {
  const handleApiRequest = createApiHandler(databasePath);
  const server = createServer(handleApiRequest);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  globalThis.fetch = (path, options) => realFetch(baseUrl + path, options);
  return {
    baseUrl,
    stop: () => {
      server.close();
      handleApiRequest.closeDatabase();
    },
  };
}

let windowCount = 0;

/**
 * Opens a "browser window": a fresh copy of the app's session module with its own keys.
 * Two windows share the server but not their unlocked state, just like two real tabs.
 */
export function openWindow() {
  windowCount += 1;
  return import(`../../src/lib/vault.svelte.js?window=${windowCount}`);
}

/** Reads a route straight from the server, the way an attacker with the database would see it. */
export async function readRaw(path) {
  return (await fetch(`/api/${path}`)).text();
}
