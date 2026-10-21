// Entry point: loads the global styles and puts the app on the page.
import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';

mount(App, { target: document.getElementById('app') });
