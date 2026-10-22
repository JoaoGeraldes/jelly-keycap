<!--
  Asks for the master password before deleting a vault and all of its logins.
  Uses the browser's own <dialog>, which handles the backdrop, focus and the Escape key.
-->
<script>
  import { textFor } from '../lib/i18n.svelte.js';
  import { deleteVault } from '../lib/vault.svelte.js';
  import CapsLockWarning from './CapsLockWarning.svelte';

  let { vault, loginCount, onDeleted, onCancel } = $props();

  const text = textFor('DeleteVaultDialog');

  let dialog;
  let password = $state('');
  let errorMessage = $state('');
  let isDeleting = $state(false);

  $effect(() => dialog.showModal());

  async function submit(event) {
    event.preventDefault();
    errorMessage = '';
    isDeleting = true;
    try {
      await deleteVault(vault.id, password);
      onDeleted();
    } catch (error) {
      errorMessage = error.message;
      isDeleting = false;
    }
  }
</script>

<dialog bind:this={dialog} onclose={onCancel}>
  <form onsubmit={submit}>
    <h1>{text.title(vault.name)}</h1>
    <p>{text.explanation(loginCount)}</p>

    <label for="delete-vault-password">{text.masterPasswordLabel}</label>
    <!-- svelte-ignore a11y_autofocus -->
    <input id="delete-vault-password" type="password" bind:value={password} autocomplete="current-password" required autofocus />

    <CapsLockWarning />
    {#if errorMessage}<p class="error" role="alert">{errorMessage}</p>{/if}

    <!-- Cancel and Delete sit at opposite ends, so a slip lands on nothing or on the safe choice. -->
    <div class="actions">
      <button type="button" class="button" onclick={() => dialog.close()}>{text.cancel}</button>
      <button class="delete" disabled={isDeleting}>{isDeleting ? text.deleting : text.deleteVault}</button>
    </div>
  </form>
</dialog>

<style>
  dialog {
    width: min(100% - 2rem, 24rem);
    padding: 1.5rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    background: var(--color-surface);
    color: var(--color-ink);
  }

  dialog::backdrop {
    background: rgb(0 0 0 / 0.4);
  }

  form {
    display: grid;
    gap: 0.6rem;
  }

  h1 {
    font-size: 1.25rem;
  }

  p:not(.error) {
    color: var(--color-ink-muted);
  }

  label {
    margin-top: 0.4rem;
    font-weight: 600;
  }

  .actions {
    display: flex;
    justify-content: space-between;
    gap: 2rem;
    margin-top: 0.8rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-line);
  }

  .actions button {
    min-width: 6rem;
  }

  .delete {
    padding: 0.55rem 0.9rem;
    border: 1px solid var(--color-danger);
    border-radius: var(--radius);
    background: var(--color-danger);
    color: var(--color-surface);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
</style>
