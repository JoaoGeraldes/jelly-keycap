// Entry point: applies your saved settings, loads the global styles and puts the app on the page.
import { mount } from 'svelte';
import App from './App.svelte';
import { loadUserSettings } from './lib/user-settings.js';
import './app.css';

// Mounted once the saved settings are in, so the first screen already has the right theme,
// text size and language.
loadUserSettings().then(() => mount(App, { target: document.getElementById('app') }));
