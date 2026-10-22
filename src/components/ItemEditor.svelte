<!--
  Views and edits one login. It works on a copy (`draft`), so nothing changes until Save.
  The parent remounts this component whenever a different login is picked.
-->
<script>
  import { generatePassword } from '../lib/crypto.js';
  import { textFor } from '../lib/i18n.svelte.js';
  import { deleteItem, saveItem } from '../lib/vault.svelte.js';

  let { item, isNew, onSaved, onClose } = $props();

  const text = textFor('ItemEditor');

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
      errorMessage = text.notSaved(error.message);
    }
  }

  // A new entry has nothing to go back to, so cancelling closes it; a saved one returns to its saved values.
  function cancel() {
    if (isNew) onClose();
    else draft = { ...item };
  }

  // No "Are you sure?": the undo note in the corner is the safety net.
  function remove() {
    deleteItem(item.id);
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
    {copiedField === field ? text.copied : text.copy}
  </button>
{/snippet}

<form class="item-editor" onsubmit={save}>
  <button type="button" class="button-quiet back" onclick={onClose}><span aria-hidden="true">←</span> {text.backToList}</button>

  <div class="field">
    <label for="item-title">{text.nameLabel}</label>
    <!-- A new entry starts with its name, so typing can start right away. Focused directly because
         Svelte's autofocus is skipped when something else (here, the New entry button) has focus. -->
    <input id="item-title" class="title-input" bind:value={draft.title} {@attach (input) => isNew && input.focus()} required />
  </div>

  <div class="field">
    <label for="item-username">{text.usernameLabel}</label>
    <div class="field-row">
      <input id="item-username" bind:value={draft.username} autocomplete="off" spellcheck="false" />
      {@render copyButton('username')}
    </div>
  </div>

  <div class="field">
    <label for="item-password">{text.passwordLabel}</label>
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
        {isPasswordVisible ? text.hide : text.show}
      </button>
      {@render copyButton('password')}
    </div>
    <button type="button" class="button-quiet generate" onclick={useGeneratedPassword}>{text.generatePassword}</button>
  </div>

  <div class="field">
    <label for="item-url">{text.websiteLabel}</label>
    <div class="field-row">
      <input id="item-url" bind:value={draft.url} inputmode="url" autocomplete="off" spellcheck="false" placeholder="github.com" />
      {#if draft.url}
        <a class="button" href={websiteLink} target="_blank" rel="noopener noreferrer">{text.open}</a>
      {/if}
    </div>
  </div>

  <div class="field">
    <label for="item-notes">{text.notesLabel}</label>
    <textarea id="item-notes" bind:value={draft.notes} rows="4"></textarea>
  </div>

  {#if errorMessage}<p class="error" role="alert">{errorMessage}</p>{/if}

  <!-- Save and Cancel sit together; Delete is set apart at the far end, so it is never hit by mistake. -->
  <div class="actions">
    <button class="button-primary" disabled={!isNew && !hasUnsavedChanges}>
      {isNew || hasUnsavedChanges ? text.save : text.saved}
    </button>
    {#if isNew || hasUnsavedChanges}
      <button type="button" class="button" onclick={cancel}>{isNew ? text.cancel : text.discardChanges}</button>
    {/if}
    {#if !isNew}
      <button type="button" class="button-quiet is-danger delete" onclick={remove}>{text.delete}</button>
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
    padding-top: 1rem;
    border-top: 1px solid var(--color-line);
  }

  .delete {
    margin-left: auto;
  }

  /* In the link color, with an arrow, so it reads as a way back and not as a heading. */
  .back {
    display: none;
    gap: 0.4rem;
    justify-self: start;
    padding-left: 0;
    color: var(--color-link);
    font-weight: 600;
  }

  .back:hover {
    color: var(--color-link);
    text-decoration: underline;
  }

  @media (max-width: 760px) {
    .back {
      display: inline-flex;
    }
  }
</style>
