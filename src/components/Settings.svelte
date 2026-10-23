<!-- App settings, one card per topic. Shown in the detail column of the vault screen. -->
<script>
  import { AUTO_LOCK_MINUTES, autoLock, setAutoLockMinutes } from '../lib/auto-lock.svelte.js';
  import { LANGUAGES, language, setLanguage, textFor } from '../lib/i18n.svelte.js';
  import ChangeMasterPassword from './ChangeMasterPassword.svelte';

  let { onClose } = $props();

  const text = textFor('Settings');

  function changeAutoLockMinutes(input) {
    setAutoLockMinutes(input.value);
    input.value = autoLock.minutes; // shows what was kept: rounded, within the limits, or unchanged if it wasn't a number
  }
</script>

<div class="settings">
  <header>
    <h1>{text.title}</h1>
    <button class="button-quiet" onclick={onClose}>{text.close}</button>
  </header>

  <ChangeMasterPassword />

  <section class="card">
    <div class="card-heading">
      <h2>{text.autoLockTitle}</h2>
      <p>{text.autoLockExplanation}</p>
    </div>
    <label class="auto-lock">
      <input
        type="number"
        aria-label={text.autoLockTitle}
        min={AUTO_LOCK_MINUTES.min}
        max={AUTO_LOCK_MINUTES.max}
        step="1"
        value={autoLock.minutes}
        onchange={(event) => changeAutoLockMinutes(event.currentTarget)}
      />
      {text.autoLockMinutes}
    </label>
  </section>

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

  .auto-lock {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-self: start;
  }

  select,
  .auto-lock input {
    justify-self: start;
    padding: 0.55rem 0.7rem;
    border: 1px solid var(--color-control-border);
    border-radius: var(--radius);
    background: var(--color-control);
    color: inherit;
    font: inherit;
  }

  select {
    min-width: 12rem;
  }

  .auto-lock input {
    width: 6rem;
  }
</style>
