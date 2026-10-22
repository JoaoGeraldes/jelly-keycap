<!-- App settings, one card per topic. Shown in the detail column of the vault screen. -->
<script>
  import { LANGUAGES, language, setLanguage, textFor } from '../lib/i18n.svelte.js';
  import ChangeMasterPassword from './ChangeMasterPassword.svelte';

  let { onClose } = $props();

  const text = textFor('Settings');
</script>

<div class="settings">
  <header>
    <h1>{text.title}</h1>
    <button class="button-quiet" onclick={onClose}>{text.close}</button>
  </header>

  <ChangeMasterPassword />

  <section class="card">
    <div class="card-heading">
      <h2>{text.languageTitle}</h2>
      <p>{text.languageExplanation}</p>
    </div>
    <select aria-label={text.languageTitle} value={language.code} onchange={(event) => setLanguage(event.currentTarget.value)}>
      {#each Object.entries(LANGUAGES) as [code, name] (code)}
        <option value={code}>{name}</option>
      {/each}
    </select>
  </section>
</div>

<style>
  .settings {
    display: grid;
    gap: 1.5rem;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  h1 {
    font-size: 1.5rem;
  }

  select {
    justify-self: start;
    min-width: 12rem;
    padding: 0.55rem 0.7rem;
    border: 1px solid var(--color-control-border);
    border-radius: var(--radius);
    background: var(--color-control);
    color: inherit;
    font: inherit;
  }
</style>
