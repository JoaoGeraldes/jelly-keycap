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

  /* Sized in px, not rem: the bar holds the text size buttons, so it must not grow or
     shrink under the cursor while they are being pressed. */
  .top-bar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    height: 40px;
    padding: 0 8px;
    border-bottom: 1px solid var(--color-line);
    background: var(--color-sidebar);
  }
</style>
