/**
 * The production web server: serves the built UI and the API, with security headers.
 * It is started by start.js; tests create it directly.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { createApiHandler } from './api.js';

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
};

// The page may only load its own files. 'wasm-unsafe-eval' lets the Argon2 WebAssembly run.
const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; img-src 'self' data:; frame-ancestors 'none'; form-action 'self'",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

/**
 * @param {object} options
 * @param {string} options.databasePath      the SQLite file
 * @param {URL} options.uiFolder             the built UI (a folder URL ending in /)
 * @param {string[]} options.allowedHostnames names the browser may use to reach the server
 */
export function createVaultServer({ databasePath, uiFolder, allowedHostnames }) {
  const handleApiRequest = createApiHandler(databasePath);

  return createServer(async (request, response) => {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) response.setHeader(name, value);

    // Rejecting unknown Host headers blocks "DNS rebinding", where a malicious website
    // points its own domain at your computer to talk to this server.
    const hostname = new URL(`http://${request.headers.host}`).hostname;
    if (!allowedHostnames.includes(hostname)) return response.writeHead(403).end('Host not allowed');

    if (request.url.startsWith('/api/')) return handleApiRequest(request, response);
    await serveUiFile(request, response, uiFolder);
  });
}

// URL parsing removes ".." segments, so a request can never reach files outside the UI folder.
async function serveUiFile(request, response, uiFolder) {
  const path = new URL(request.url, 'http://localhost').pathname;
  try {
    const content = await readFile(new URL(`.${path}`, uiFolder));
    response.writeHead(200, { 'Content-Type': CONTENT_TYPES[extname(path)] ?? 'application/octet-stream' }).end(content);
  } catch {
    // "/" and any unknown path get the app itself.
    const page = await readFile(new URL('index.html', uiFolder));
    response.writeHead(200, { 'Content-Type': CONTENT_TYPES['.html'] }).end(page);
  }
}
