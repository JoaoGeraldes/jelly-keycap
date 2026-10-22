<!-- A slim bar with the display settings, then the lock screen or, once unlocked, the vault. -->
<script>
  import DisplaySettings from "./components/DisplaySettings.svelte";
  import logo from "./media/logo-symbol.svg";
  import LockScreen from "./screens/LockScreen.svelte";
  import VaultScreen from "./screens/VaultScreen.svelte";
  import { session } from "./lib/vault.svelte.js";
</script>

<div class="app">
  <header class="top-bar">
    <img class="logo" src={logo} alt="Jelly Keycap" />
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
    justify-content: space-between; /* the logo on the left, display settings on the right */
    height: 40px;
    padding: 0 8px;
    border-bottom: 1px solid var(--color-line);
    background: var(--color-sidebar);
  }

  /* An odd height on purpose: the bar has 39px inside its border, so 23px centres on a whole
     pixel. Off by half a pixel, the curves get smeared and look jagged on normal screens. */
  .logo {
    height: 23px;
    padding-left: 4px;
  }
</style>
