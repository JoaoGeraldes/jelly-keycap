// Entry point: applies your display settings, loads the global styles and puts the app on the page.
import { mount } from 'svelte';
import App from './App.svelte';
import { applyDisplaySettings, loadDisplaySettings } from './lib/display-settings.js';
import './app.css';

applyDisplaySettings(loadDisplaySettings()); // before mounting, so the first paint has the right theme
mount(App, { target: document.getElementById('app') });
