<!--
  Replaces the vault with a backup file. Worded and built to be calm: the current vault is
  always saved first, a wrong file changes nothing, and the password is only asked once a
  file has been chosen.
-->
<script>
  import { restoreBackup } from '../lib/vault.svelte.js';
  import CapsLockWarning from './CapsLockWarning.svelte';

  let backupFile = $state(null);
  let password = $state('');
  let errorMessage = $state('');
  let isRestoring = $state(false);

  async function submit(event) {
    event.preventDefault();
    errorMessage = '';
    isRestoring = true;
    try {
      await restoreBackup(backupFile, password); // locks the app when done
    } catch (error) {
      errorMessage = error.message;
      isRestoring = false;
    }
  }
</script>

<section class="card">
  <div class="card-heading">
    <h2>Restore a backup</h2>
    <p>
      Bring your vault back to how it was in a backup file. Your current vault is saved as a copy first, so nothing
      is lost, and you can switch back any time by restoring that copy the same way.
    </p>
    <p>
      Restoring copies what’s inside the backup into your usual vault file, so the app keeps using the same file and
      location as before. The backup file you pick is only read, never changed.
    </p>
  </div>

  <form onsubmit={submit}>
    <label for="backup-file">Backup file</label>
    <input
      id="backup-file"
      type="file"
      accept=".sqlite"
      onchange={(event) => (backupFile = event.currentTarget.files[0] ?? null)}
      required
    />

    {#if backupFile}
      <label for="restore-password">Your current master password, to confirm it’s you</label>
      <input id="restore-password" type="password" bind:value={password} autocomplete="current-password" required />
      <CapsLockWarning />
      {#if errorMessage}<p class="error" role="alert">{errorMessage}</p>{/if}

      <button class="button-primary" disabled={isRestoring}>{isRestoring ? 'Restoring…' : 'Restore this backup'}</button>
    {/if}
  </form>
</section>

<style>
  form {
    display: grid;
    gap: 0.6rem;
    max-width: 28rem;
  }

  label {
    margin-top: 0.4rem;
    font-weight: 600;
  }

  .button-primary {
    justify-self: start;
    margin-top: 0.4rem;
  }
</style>
