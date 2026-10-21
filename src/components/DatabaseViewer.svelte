<!--
  Read-only view of the raw database: every table, column and value exactly as stored.
  It shows what anyone with a copy of vault.sqlite would see.
-->
<script>
  import { api } from '../lib/api.js';

  let { onClose } = $props();

  let tables = $state([]);
  let tableName = $state(null);
  let page = $state(null); // { columns, rows, page, pageCount, rowCount }

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
  <p class="explanation">Exactly what is stored on the server. Anything secret is encrypted.</p>

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
              {#each page.columns as column}<td>{row[column] ?? 'NULL'}</td>{/each}
            </tr>
          {:else}
            <tr><td class="empty" colspan={page.columns.length}>This table is empty.</td></tr>
          {/each}
        </tbody>
      </table>
    </div>

    <footer>
      <button class="button" disabled={page.page <= 1} onclick={() => showPage(tableName, page.page - 1)}>Previous</button>
      <span>Page {page.page} of {page.pageCount}, {page.rowCount} rows</span>
      <button class="button" disabled={page.page >= page.pageCount} onclick={() => showPage(tableName, page.page + 1)}>
        Next
      </button>
    </footer>
  {/if}
</div>

<style>
  .database-viewer {
    display: grid;
    gap: 1rem;
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

  .explanation,
  footer span {
    color: var(--color-ink-muted);
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
    background: var(--color-surface);
    white-space: nowrap;
  }

  /* Encrypted values are long single words; let them wrap so every character stays visible. */
  td {
    min-width: 8rem;
    max-width: 28rem;
    overflow-wrap: anywhere;
  }
</style>
