<!--
  Asks for the master password before deleting a vault and all of its logins.
  Uses the browser's own <dialog>, which handles the backdrop, focus and the Escape key.
-->
<script>
  import { deleteVault } from '../lib/vault.svelte.js';
  import CapsLockWarning from './CapsLockWarning.svelte';

  let { vault, loginCount, onDeleted, onCancel } = $props();

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
    <h1>Delete “{vault.name}”?</h1>
    <p>This deletes the vault and its {loginCount} login{loginCount === 1 ? '' : 's'}. It can’t be undone.</p>

    <label for="delete-vault-password">Master password</label>
    <!-- svelte-ignore a11y_autofocus -->
    <input id="delete-vault-password" type="password" bind:value={password} autocomplete="current-password" required autofocus />

    <CapsLockWarning />
    {#if errorMessage}<p class="error" role="alert">{errorMessage}</p>{/if}

    <div class="actions">
      <button class="delete" disabled={isDeleting}>{isDeleting ? 'Deleting…' : 'Delete'}</button>
      <button type="button" class="button-quiet" onclick={() => dialog.close()}>Cancel</button>
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
    gap: 0.5rem;
    margin-top: 0.8rem;
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
