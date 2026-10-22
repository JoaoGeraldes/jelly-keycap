<!--
  Views and edits one login. It works on a copy (`draft`), so nothing changes until Save.
  The parent remounts this component whenever a different login is picked.
-->
<script>
  import { generatePassword } from '../lib/crypto.js';
  import { deleteItem, saveItem } from '../lib/vault.svelte.js';

  let { item, isNew, onSaved, onClose } = $props();

  // A copy on purpose: edits stay in the draft until Save. A different item remounts this component.
  // svelte-ignore state_referenced_locally
  let draft = $state({ ...item });
  let isPasswordVisible = $state(false);
  let copiedField = $state(null);
  let errorMessage = $state('');

  const hasUnsavedChanges = $derived(JSON.stringify(draft) !== JSON.stringify(item));
  // Always link with http(s), so a saved "javascript:" address can never run as code.
  const websiteLink = $derived(/^https?:\/\//i.test(draft.url) ? draft.url : `https://${draft.url}`);

  async function save(event) {
    event.preventDefault();
    errorMessage = '';
    try {
      onSaved(await saveItem(draft));
    } catch (error) {
      errorMessage = `Not saved: ${error.message}`;
    }
  }

  async function remove() {
    if (!confirm(`Delete “${draft.title}”? This can’t be undone.`)) return;
    await deleteItem(item.id);
    onClose();
  }

  async function copy(field) {
    await navigator.clipboard.writeText(draft[field]);
    copiedField = field;
    setTimeout(() => (copiedField = null), 1500);
  }

  function useGeneratedPassword() {
    draft.password = generatePassword();
    isPasswordVisible = true;
  }
</script>

{#snippet copyButton(field)}
  <button type="button" class="button" onclick={() => copy(field)} disabled={!draft[field]}>
    {copiedField === field ? 'Copied' : 'Copy'}
  </button>
{/snippet}

<form class="item-editor" onsubmit={save}>
  <button type="button" class="button-quiet back" onclick={onClose}>Back to list</button>

  <div class="field">
    <label for="item-title">Name: what this is for, so you can find it later (like GitHub, Home Wi‑Fi or Bank PIN)</label>
    <!-- A new entry starts with its name, so typing can start right away. Focused directly because
         Svelte's autofocus is skipped when something else (here, the New entry button) has focus. -->
    <input id="item-title" class="title-input" bind:value={draft.title} {@attach (input) => isNew && input.focus()} required />
  </div>

  <div class="field">
    <label for="item-username">Username or email</label>
    <div class="field-row">
      <input id="item-username" bind:value={draft.username} autocomplete="off" spellcheck="false" />
      {@render copyButton('username')}
    </div>
  </div>

  <div class="field">
    <label for="item-password">Password</label>
    <div class="field-row">
      <input
        id="item-password"
        class="password-input"
        type={isPasswordVisible ? 'text' : 'password'}
        bind:value={draft.password}
        autocomplete="new-password"
        spellcheck="false"
      />
      <button type="button" class="button" onclick={() => (isPasswordVisible = !isPasswordVisible)}>
        {isPasswordVisible ? 'Hide' : 'Show'}
      </button>
      {@render copyButton('password')}
    </div>
    <button type="button" class="button-quiet generate" onclick={useGeneratedPassword}>Generate a strong password</button>
  </div>

  <div class="field">
    <label for="item-url">Website</label>
    <div class="field-row">
      <input id="item-url" bind:value={draft.url} inputmode="url" autocomplete="off" spellcheck="false" placeholder="github.com" />
      {#if draft.url}
        <a class="button" href={websiteLink} target="_blank" rel="noopener noreferrer">Open</a>
      {/if}
    </div>
  </div>

  <div class="field">
    <label for="item-notes">Notes</label>
    <textarea id="item-notes" bind:value={draft.notes} rows="4"></textarea>
  </div>

  {#if errorMessage}<p class="error" role="alert">{errorMessage}</p>{/if}

  <div class="actions">
    <button class="button-primary" disabled={!isNew && !hasUnsavedChanges}>
      {isNew || hasUnsavedChanges ? 'Save' : 'Saved'}
    </button>
    {#if !isNew}
      <button type="button" class="button-quiet is-danger" onclick={remove}>Delete</button>
    {/if}
  </div>
</form>

<style>
  .item-editor {
    display: grid;
    gap: 1.25rem;
    max-width: 36rem;
  }

  .title-input {
    padding: 0.2rem 0;
    border: 0;
    border-bottom: 1px solid var(--color-line);
    border-radius: 0;
    background: none;
    font-size: 1.75rem;
    font-weight: 700;
  }

  .field {
    display: grid;
    gap: 0.35rem;
  }

  label {
    color: var(--color-ink-muted);
    font-size: 0.85rem;
    font-weight: 600;
  }

  .field-row {
    display: flex;
    gap: 0.4rem;
  }

  .password-input {
    font-family: var(--font-mono);
    letter-spacing: 0.04em;
  }

  .generate {
    justify-self: start;
    padding-left: 0;
    color: var(--color-link);
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  .back {
    display: none;
    justify-self: start;
    padding-left: 0;
  }

  @media (max-width: 760px) {
    .back {
      display: inline-flex;
    }
  }
</style>
