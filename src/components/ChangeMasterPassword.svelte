<!-- The "Master password" card in Settings: replaces the master password. -->
<script>
  import { textFor } from '../lib/i18n.svelte.js';
  import { MINIMUM_MASTER_PASSWORD_LENGTH, changeMasterPassword } from '../lib/vault.svelte.js';
  import CapsLockWarning from './CapsLockWarning.svelte';

  const text = textFor('ChangeMasterPassword');

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
      errorMessage = text.passwordsDontMatch;
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

<section class="card">
  <div class="card-heading">
    <h2>{text.title}</h2>
    <p>{text.explanation}</p>
  </div>

  {#if isChanged}
    <p class="notice" role="status">{text.changed}</p>
  {:else}
    <form onsubmit={submit}>
      <label for="current-password">{text.currentLabel}</label>
      <input id="current-password" type="password" bind:value={currentPassword} autocomplete="current-password" required />

      <label for="new-password">{text.newLabel}</label>
      <input
        id="new-password"
        type="password"
        bind:value={newPassword}
        minlength={MINIMUM_MASTER_PASSWORD_LENGTH}
        autocomplete="new-password"
        required
      />

      <label for="new-password-again">{text.newAgainLabel}</label>
      <input id="new-password-again" type="password" bind:value={newPasswordAgain} autocomplete="new-password" required />

      <CapsLockWarning />
      {#if errorMessage}<p class="error" role="alert">{errorMessage}</p>{/if}

      <button class="button-primary" disabled={isWorking}>{isWorking ? text.changing : text.change}</button>
    </form>
  {/if}
</section>

<style>
  form {
    display: grid;
    gap: 0.6rem;
    max-width: 24rem;
  }

  label {
    margin-top: 0.4rem;
    color: var(--color-ink-muted);
    font-size: 0.85rem;
    font-weight: 600;
  }

  .notice {
    max-width: 40rem;
  }

  .button-primary {
    justify-self: start;
    margin-top: 0.4rem;
  }
</style>
