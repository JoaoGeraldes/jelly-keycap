<!-- Shows the lock screen until the vault is unlocked, then the vault itself. -->
<script>
  import LockScreen from './screens/LockScreen.svelte';
  import VaultScreen from './screens/VaultScreen.svelte';
  import { session } from './lib/vault.svelte.js';
</script>

{#if session.isUnlocked}
  <VaultScreen />
{:else}
  <LockScreen />
{/if}
