<!-- App settings, one card per topic. Shown in the detail column of the vault screen. -->
<script>
  import ChangeMasterPassword from './ChangeMasterPassword.svelte';

  let { onClose } = $props();
</script>

<div class="settings">
  <header>
    <h1>Settings</h1>
    <button class="button-quiet" onclick={onClose}>Close</button>
  </header>

  <ChangeMasterPassword />

  <!-- Placeholder: the language choice isn't built yet. -->
  <section class="card">
    <div class="card-heading">
      <h2>Language</h2>
      <p>Choosing the app’s language is coming soon. For now it is in English.</p>
    </div>
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
</style>
