<!--
  The first thing anyone sees. Creates the master password on first run;
  after that, asks for it to unlock.
-->
<script>
  import { textFor } from '../lib/i18n.svelte.js';
  import {
    MINIMUM_MASTER_PASSWORD_LENGTH,
    createMasterPassword,
    hasMasterPassword,
    session,
    unlock,
  } from '../lib/vault.svelte.js';
  import CapsLockWarning from '../components/CapsLockWarning.svelte';
  import Ragdoll from '../components/Ragdoll.svelte';

  const text = textFor('LockScreen');

  let isFirstRun = $state(null); // null while asking the server
  let password = $state('');
  let passwordAgain = $state('');
  let errorMessage = $state('');
  let isWorking = $state(false);
  let keystrokes = $state(0); // only counted, to knock over and kick the burglar

  hasMasterPassword()
    .then((hasOne) => (isFirstRun = !hasOne))
    .catch(() => (errorMessage = text.cantReachServer));

  async function submit(event) {
    event.preventDefault();
    errorMessage = '';
    if (isFirstRun && password !== passwordAgain) {
      errorMessage = text.passwordsDontMatch;
      return;
    }
    isWorking = true;
    try {
      await (isFirstRun ? createMasterPassword(password) : unlock(password));
    } catch (error) {
      errorMessage = error.message;
      isWorking = false;
    }
  }
</script>

<main class="lock-screen">
  <Ragdoll {keystrokes} />

  {#if isFirstRun !== null}
    <form onsubmit={submit}>
      {#if isFirstRun}
        <h1>{text.createTitle}</h1>
        <p class="explanation">{text.createExplanation}</p>
      {:else}
        <h1>{text.unlockTitle}</h1>
      {/if}

      <!-- Why the vault locked itself, if it did. Informational, so not shown as an error. -->
      {#if session.lockReason}<p class="notice" role="status">{session.lockReason}</p>{/if}

      <label for="master-password">{text.masterPasswordLabel}</label>
      <!-- svelte-ignore a11y_autofocus -->
      <input
        id="master-password"
        type="password"
        bind:value={password}
        oninput={() => keystrokes++}
        minlength={isFirstRun ? MINIMUM_MASTER_PASSWORD_LENGTH : undefined}
        autocomplete={isFirstRun ? 'new-password' : 'current-password'}
        required
        autofocus
      />

      {#if isFirstRun}
        <label for="master-password-again">{text.typeItAgainLabel}</label>
        <input id="master-password-again" type="password" bind:value={passwordAgain} oninput={() => keystrokes++} autocomplete="new-password" required />
      {/if}

      <CapsLockWarning />
      {#if errorMessage}<p class="error" role="alert">{errorMessage}</p>{/if}

      <button class="button-primary" disabled={isWorking}>
        {#if isFirstRun}{isWorking ? text.creating : text.create}{:else}{isWorking ? text.unlocking : text.unlock}{/if}
      </button>
    </form>
  {:else if errorMessage}
    <p class="error" role="alert">{errorMessage}</p>
  {/if}
</main>

<style>
  .lock-screen {
    display: grid;
    place-items: center;
    align-content: center;
    gap: 2rem;
    min-height: 100%;
    padding: 1.5rem;
  }

  form {
    display: grid;
    gap: 0.6rem;
    width: min(100%, 22rem);
  }

  h1 {
    font-size: 1.5rem;
    line-height: 1.25;
    text-align: center;
  }

  .notice {
    padding: 0.6rem 0.8rem;
    border-left: 3px solid var(--color-accent);
    background: var(--color-surface);
    overflow-wrap: anywhere; /* long file paths wrap instead of overflowing */
  }

  .explanation {
    margin-bottom: 0.5rem;
    color: var(--color-ink-muted);
    text-align: center;
  }

  label {
    margin-top: 0.4rem;
    font-weight: 600;
  }

  .button-primary {
    margin-top: 0.8rem;
  }
</style>
