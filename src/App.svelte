<!-- A slim bar with the display settings, then the lock screen or, once unlocked, the vault. -->
<script>
  import DisplaySettings from './components/DisplaySettings.svelte';
  import LockScreen from './screens/LockScreen.svelte';
  import VaultScreen from './screens/VaultScreen.svelte';
  import { session } from './lib/vault.svelte.js';
</script>

<div class="app">
  <header class="top-bar">
    <DisplaySettings />
  </header>

  {#if session.isUnlocked}
    <VaultScreen />
  {:else}
    <LockScreen />
  {/if}
</div>

<style>
  .app {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    height: 100dvh;
    overflow: auto;
  }

  .top-bar {
    display: flex;
    justify-content: flex-end;
    padding: 0.2rem 0.5rem;
    border-bottom: 1px solid var(--color-line);
    background: var(--color-sidebar);
  }
</style>
