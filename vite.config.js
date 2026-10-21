import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { createApiHandler, DEFAULT_DATABASE_PATH } from './server/api.js';

/** Runs the real API inside Vite's dev server, so `npm run dev` is one process with hot reload. */
const apiInDevServer = {
  name: 'vault-api',
  configureServer(server) {
    const handleApiRequest = createApiHandler(DEFAULT_DATABASE_PATH);
    server.middlewares.use((request, response, next) =>
      request.url.startsWith('/api/') ? handleApiRequest(request, response) : next(),
    );
  },
};

export default defineConfig({
  plugins: [svelte(), apiInDevServer],
});
