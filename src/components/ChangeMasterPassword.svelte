<!-- Form to replace the master password. Shown in the detail column of the vault screen. -->
<script>
  import { MINIMUM_MASTER_PASSWORD_LENGTH, changeMasterPassword } from '../lib/vault.svelte.js';
  import CapsLockWarning from './CapsLockWarning.svelte';

  let { onClose } = $props();

  let currentPassword = $state('');
  let newPassword = $state('');
  let newPasswordAgain = $state('');
  let errorMessage = $state('');
  let isWorking = $state(false);
  let isChanged = $state(false);

  async function submit(event) {
    event.preventDefault();
    errorMessage = '';
    if (newPassword !== newPasswordAgain) {
      errorMessage = 'The two new passwords don’t match.';
      return;
    }
    isWorking = true;
    try {
      await changeMasterPassword(currentPassword, newPassword);
      isChanged = true;
    } catch (error) {
      errorMessage = error.message;
    }
    isWorking = false;
  }
</script>

{#if isChanged}
  <div class="change-master-password">
    <h1>Master password changed</h1>
    <p>Use the new one next time you unlock. Backups made before today still open with the old one.</p>
    <button class="button" onclick={onClose}>Done</button>
  </div>
{:else}
  <form class="change-master-password" onsubmit={submit}>
    <h1>Change master password</h1>

    <label for="current-password">Current master password</label>
    <input id="current-password" type="password" bind:value={currentPassword} autocomplete="current-password" required />

    <label for="new-password">New master password</label>
    <input
      id="new-password"
      type="password"
      bind:value={newPassword}
      minlength={MINIMUM_MASTER_PASSWORD_LENGTH}
      autocomplete="new-password"
      required
    />

    <label for="new-password-again">Type the new one again</label>
    <input id="new-password-again" type="password" bind:value={newPasswordAgain} autocomplete="new-password" required />

    <CapsLockWarning />
    {#if errorMessage}<p class="error" role="alert">{errorMessage}</p>{/if}

    <div class="actions">
      <button class="button-primary" disabled={isWorking}>{isWorking ? 'Changing…' : 'Change master password'}</button>
      <button type="button" class="button-quiet" onclick={onClose}>Cancel</button>
    </div>
  </form>
{/if}

<style>
  .change-master-password {
    display: grid;
    gap: 0.6rem;
    max-width: 24rem;
  }

  h1 {
    margin-bottom: 0.5rem;
    font-size: 1.5rem;
  }

  label {
    margin-top: 0.4rem;
    color: var(--color-ink-muted);
    font-size: 0.85rem;
    font-weight: 600;
  }

  p {
    color: var(--color-ink-muted);
  }

  .button {
    justify-self: start;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.8rem;
  }
</style>
