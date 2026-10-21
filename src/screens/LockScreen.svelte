<!--
  The first thing anyone sees. Creates the master password on first run;
  after that, asks for it to unlock.
-->
<script>
  import {
    MINIMUM_MASTER_PASSWORD_LENGTH,
    createMasterPassword,
    hasMasterPassword,
    session,
    unlock,
  } from '../lib/vault.svelte.js';

  let isFirstRun = $state(null); // null while asking the server
  let password = $state('');
  let passwordAgain = $state('');
  let errorMessage = $state(session.lockReason); // why the vault locked itself, if it did
  let isWorking = $state(false);

  hasMasterPassword()
    .then((hasOne) => (isFirstRun = !hasOne))
    .catch(() => (errorMessage = 'Can’t reach the vault server. Check that it’s running, then reload this page.'));

  async function submit(event) {
    event.preventDefault();
    errorMessage = '';
    if (isFirstRun && password !== passwordAgain) {
      errorMessage = 'The two passwords don’t match.';
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
  <svg class="keyhole" viewBox="0 0 48 72" aria-hidden="true">
    <circle cx="24" cy="20" r="16" />
    <path d="M14 30 L8 70 H40 L34 30 Z" />
  </svg>

  {#if isFirstRun !== null}
    <form onsubmit={submit}>
      {#if isFirstRun}
        <h1>Create your master password</h1>
        <p class="explanation">
          This one password unlocks everything you save here. It can’t be reset or recovered, so write it down
          and keep it somewhere safe.
        </p>
      {:else}
        <h1>Unlock your vault</h1>
      {/if}

      <label for="master-password">Master password</label>
      <!-- svelte-ignore a11y_autofocus -->
      <input
        id="master-password"
        type="password"
        bind:value={password}
        minlength={isFirstRun ? MINIMUM_MASTER_PASSWORD_LENGTH : undefined}
        autocomplete={isFirstRun ? 'new-password' : 'current-password'}
        required
        autofocus
      />

      {#if isFirstRun}
        <label for="master-password-again">Type it again</label>
        <input id="master-password-again" type="password" bind:value={passwordAgain} autocomplete="new-password" required />
      {/if}

      {#if errorMessage}<p class="error" role="alert">{errorMessage}</p>{/if}

      <button class="button-primary" disabled={isWorking}>
        {#if isFirstRun}{isWorking ? 'Creating…' : 'Create master password'}{:else}{isWorking ? 'Unlocking…' : 'Unlock'}{/if}
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
    min-height: 100dvh;
    padding: 1.5rem;
  }

  /* The one bold element in the app: a large brass keyhole. */
  .keyhole {
    width: 4.5rem;
    fill: var(--color-brass);
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
