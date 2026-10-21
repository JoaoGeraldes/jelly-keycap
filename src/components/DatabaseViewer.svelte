<!--
  Read-only view of the raw database: where the file is, and every table, column and value
  exactly as stored. It shows what anyone with a copy of vault.sqlite would see.
  Restoring a backup lives at the bottom, in RestoreBackup.svelte.
-->
<script>
  import { BACKUP_URL, api } from '../lib/api.js';
  import { formatCell, formatSize, isTimestampColumn } from '../lib/format.js';
  import RestoreBackup from './RestoreBackup.svelte';

  let { onClose } = $props();

  let tables = $state([]);
  let tableName = $state(null);
  let page = $state(null); // { columns, rows, page, pageCount, rowCount }
  let databaseFile = $state(null); // { path, sizeBytes }

  api.getDatabaseFile().then((file) => (databaseFile = file));

  api.listTables().then((list) => {
    tables = list;
    showPage(list[0].name, 1);
  });

  async function showPage(name, pageNumber) {
    tableName = name;
    page = await api.readTable(name, pageNumber);
  }
</script>

<div class="database-viewer">
  <header>
    <h1>Database</h1>
    <button class="button-quiet" onclick={onClose}>Close</button>
  </header>

  {#if databaseFile}
    <section class="card">
      <div class="card-heading">
        <h2>Where your vault is stored</h2>
        <p>Your whole vault is this one file ({formatSize(databaseFile.sizeBytes)}).</p>
      </div>
      <code class="path">{databaseFile.path}</code>
      <p class="explanation">
        Download a backup to keep a copy somewhere safe, like a USB stick or a cloud folder. It stays encrypted, and
        copying the file while the app is closed works too.
      </p>
      <a class="button download" href={BACKUP_URL} download>Download backup</a>
    </section>
  {/if}

  <section class="card">
    <div class="card-heading">
      <h2>What’s inside</h2>
      <p>
        Exactly what is stored in that file. Anything secret is encrypted. Dates are shown in your local time; point at
        one to see the stored value.
      </p>
    </div>

    <nav aria-label="Tables">
      {#each tables as table (table.name)}
        <button class="button" class:is-selected={table.name === tableName} onclick={() => showPage(table.name, 1)}>
          {table.name} ({table.rowCount})
        </button>
      {/each}
    </nav>

    {#if page}
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              {#each page.columns as column}<th>{column}</th>{/each}
            </tr>
          </thead>
          <tbody>
            {#each page.rows as row}
              <tr>
                {#each page.columns as column}
                  <td
                    class:is-timestamp={isTimestampColumn(column)}
                    title={isTimestampColumn(column) ? `Stored as ${row[column]}` : undefined}
                  >
                    {formatCell(column, row[column])}
                  </td>
                {/each}
              </tr>
            {:else}
              <tr><td class="empty" colspan={page.columns.length}>This table is empty.</td></tr>
            {/each}
          </tbody>
        </table>
      </div>

      <footer>
        <button class="button" disabled={page.page <= 1} onclick={() => showPage(tableName, page.page - 1)}>Previous</button>
        <span>Page {page.page} of {page.pageCount}, {page.rowCount} {page.rowCount === 1 ? 'row' : 'rows'}</span>
        <button class="button" disabled={page.page >= page.pageCount} onclick={() => showPage(tableName, page.page + 1)}>
          Next
        </button>
      </footer>
    {/if}
  </section>

  <RestoreBackup />
</div>

<style>
  .database-viewer {
    display: grid;
    gap: 1.5rem;
  }

  header,
  nav,
  footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  header {
    justify-content: space-between;
  }

  h1 {
    font-size: 1.5rem;
  }

  .path {
    justify-self: start;
    max-width: 100%;
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    background: var(--color-background); /* stands out from the card it sits in */
    font-family: var(--font-mono);
    overflow-wrap: anywhere;
    user-select: all; /* one click selects the whole path, ready to copy */
  }

  .download {
    justify-self: start;
  }

  .explanation,
  footer span {
    color: var(--color-ink-muted);
  }

  .explanation {
    max-width: 40rem; /* a comfortable line length */
  }

  .is-selected {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .table-scroll {
    overflow-x: auto;
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font: 0.8rem / 1.4 var(--font-mono);
  }

  th,
  td {
    padding: 0.4rem 0.6rem;
    border-bottom: 1px solid var(--color-line);
    text-align: left;
    vertical-align: top;
  }

  th {
    background: var(--color-background);
    white-space: nowrap;
  }

  /* Encrypted values are long single words; let them wrap so every character stays visible. */
  td {
    min-width: 8rem;
    max-width: 28rem;
    overflow-wrap: anywhere;
  }

  td.is-timestamp {
    min-width: 0;
    white-space: nowrap;
  }
</style>
