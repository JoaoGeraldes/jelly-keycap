// Loaded before every test file (see the "test" script in package.json).
import { register } from 'node:module';

register('./svelte-state-hook.js', import.meta.url);
