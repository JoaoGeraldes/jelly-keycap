<!--
  The unlocked app, in three columns: vaults, the logins in the chosen vault, and the
  login being viewed or edited. On a phone it shows one column at a time.
-->
<script>
  import ChangeMasterPassword from "../components/ChangeMasterPassword.svelte";
  import DatabaseViewer from "../components/DatabaseViewer.svelte";
  import DeleteVaultDialog from "../components/DeleteVaultDialog.svelte";
  import HowItWorks from "../components/HowItWorks.svelte";
  import ItemEditor from "../components/ItemEditor.svelte";
  import { cloneItem, createVault, deleteVault, lock, newItem, session } from "../lib/vault.svelte.js";

  let selectedVaultId = $state(session.vaults[0]?.id);
  let selectedItem = $state(null); // a saved item, or a new one that isn't saved yet
  let openPanel = $state(null); // 'change-password', 'database', 'how-it-works', or null to show the selected item
  let searchText = $state("");
  let isNamingNewVault = $state(false);
  let vaultBeingDeleted = $state(null); // kept here, so the dialog still has it once it leaves the list
  let newVaultName = $state("");

  const isWidePanelOpen = $derived(
    openPanel === "database" || openPanel === "how-it-works",
  );
  const selectedVault = $derived(
    session.vaults.find((vault) => vault.id === selectedVaultId),
  );
  const isSelectedItemNew = $derived(
    selectedItem && !session.items.some((item) => item.id === selectedItem.id),
  );
  const visibleItems = $derived(
    session.items
      .filter(
        (item) =>
          item.vaultId === selectedVaultId && matchesSearch(item, searchText),
      )
      .sort((first, second) => first.title.localeCompare(second.title)),
  );

  function matchesSearch(item, text) {
    const query = text.trim().toLowerCase();
    return [item.title, item.username, item.url].some((field) =>
      field.toLowerCase().includes(query),
    );
  }

  function countItems(vaultId) {
    return session.items.filter((item) => item.vaultId === vaultId).length;
  }

  function selectVault(vaultId) {
    selectedVaultId = vaultId;
    showItem(null);
    searchText = "";
  }

  // The detail column shows either one item or one panel.
  function showItem(item) {
    openPanel = null;
    selectedItem = item;
  }

  function showPanel(name) {
    selectedItem = null;
    openPanel = name;
  }

  async function addVault(event) {
    event.preventDefault();
    // Cleared before saving, so the blur that follows Enter can't create the vault twice.
    const name = newVaultName.trim();
    newVaultName = "";
    isNamingNewVault = false;
    if (name) selectVault(await createVault(name));
  }

  // Only a vault with logins in it needs the password dialog.
  async function askToDeleteVault(vault) {
    if (countItems(vault.id) > 0) {
      vaultBeingDeleted = vault;
      return;
    }
    await deleteVault(vault.id);
    afterVaultDeleted();
  }

  function afterVaultDeleted() {
    vaultBeingDeleted = null;
    selectVault(session.vaults[0]?.id);
  }
</script>

<div
  class="vault-screen"
  class:is-showing-detail={selectedItem || openPanel}
  class:is-showing-wide-panel={isWidePanelOpen}
>
  <nav class="vaults" aria-label="Vaults">
    <p class="vaults-heading">Vaults</p>

    {#each session.vaults as vault (vault.id)}
      <button
        class="vault-button"
        class:is-selected={vault.id === selectedVaultId}
        onclick={() => selectVault(vault.id)}
      >
        <span>{vault.name}</span>
        <span class="count">{countItems(vault.id)}</span>
      </button>
    {/each}

    <!-- Set apart from the list, so it reads as an action and not as one more vault. -->
    <div class="new-vault-area">
      {#if isNamingNewVault}
        <form onsubmit={addVault}>
          <!-- svelte-ignore a11y_autofocus -->
          <input
            bind:value={newVaultName}
            placeholder="Name the new vault"
            aria-label="New vault name"
            onblur={addVault}
            autofocus
          />
        </form>
      {:else}
        <button
          class="button-quiet new-vault"
          onclick={() => (isNamingNewVault = true)}
        >
          <span aria-hidden="true">+</span> New vault
        </button>
      {/if}
    </div>

    <div class="vaults-footer">
      <button class="button-quiet" onclick={() => showPanel("how-it-works")}
        >How it works</button
      >
      <button class="button-quiet" onclick={() => showPanel("database")}
        >View database</button
      >
      <button class="button-quiet" onclick={() => showPanel("change-password")}
        >Change master password</button
      >
      <button class="button-quiet" onclick={() => lock()}>Lock</button>
    </div>
  </nav>

  <section class="items" aria-label="Logins">
    {#if selectedVault}
      <header>
        <h1>{selectedVault.name}</h1>
        <button
          class="button-primary"
          onclick={() => showItem(newItem(selectedVaultId))}>New entry</button
        >
      </header>
      <input
        type="search"
        bind:value={searchText}
        placeholder="Search {selectedVault.name}"
        aria-label="Search logins"
      />

      <ul>
        {#each visibleItems as item (item.id)}
          <li class="item" class:is-selected={item.id === selectedItem?.id}>
            <button class="item-row" onclick={() => showItem(item)}>
              <span class="initial" aria-hidden="true"
                >{(item.title[0] ?? "?").toUpperCase()}</span
              >
              <span class="item-text">
                <span class="item-title">{item.title}</span>
                <span class="item-subtitle">{item.username || item.url}</span>
              </span>
            </button>
            <!-- Opens the clone unsaved, so it can be renamed first and nothing is added until Save. -->
            <button class="button clone" aria-label="Clone {item.title}" onclick={() => showItem(cloneItem(item))}>
              Clone
            </button>
          </li>
        {:else}
          <li class="empty">
            {searchText
              ? `Nothing in ${selectedVault.name} matches “${searchText}”.`
              : "No logins here yet. Add one with New entry."}
          </li>
        {/each}
      </ul>

      <button
        class="button-quiet is-danger delete-vault"
        onclick={() => askToDeleteVault(selectedVault)}
        >Delete this vault</button
      >
    {:else}
      <p class="empty">Create a vault to start saving logins.</p>
    {/if}
  </section>

  <section class="detail" aria-label="Login details">
    {#if openPanel === "change-password"}
      <ChangeMasterPassword onClose={() => showItem(null)} />
    {:else if openPanel === "database"}
      <DatabaseViewer onClose={() => showItem(null)} />
    {:else if openPanel === "how-it-works"}
      <HowItWorks onClose={() => showItem(null)} />
    {:else if selectedItem}
      <!-- A different item remounts the editor, so it always starts from that item's saved values. -->
      {#key selectedItem.id}
        <ItemEditor
          item={selectedItem}
          isNew={isSelectedItemNew}
          onSaved={(item) => (selectedItem = item)}
          onClose={() => showItem(null)}
        />
      {/key}
    {:else}
      <p class="empty">Pick an entry to see it, or add a new one.</p>
    {/if}
  </section>
</div>

{#if vaultBeingDeleted}
  <DeleteVaultDialog
    vault={vaultBeingDeleted}
    loginCount={countItems(vaultBeingDeleted.id)}
    onDeleted={afterVaultDeleted}
    onCancel={() => (vaultBeingDeleted = null)}
  />
{/if}

<style>
  .vault-screen {
    display: grid;
    grid-template-columns: 14rem 20rem 1fr;
    height: 100%;
  }

  .vaults,
  .items {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 1.25rem 0.75rem;
    overflow-y: auto;
    border-right: 1px solid var(--color-line);
  }

  .vaults {
    background: var(--color-sidebar);
  }

  .items {
    gap: 0.75rem;
    background: var(--color-surface);
  }

  /* The database table and the diagram need the room more than the list of logins does. */
  .is-showing-wide-panel {
    grid-template-columns: 14rem 1fr;
  }

  .is-showing-wide-panel .items {
    display: none;
  }

  .detail {
    padding: 2rem clamp(1.25rem, 4vw, 3rem);
    overflow-y: auto;
  }

  .detail > .empty {
    margin-top: 4rem;
    text-align: center;
  }

  .vaults-heading {
    margin: 0 0.6rem 1rem;
    color: var(--color-accent);
    font-weight: 700;
    font-size: 1.1rem;
  }

  .vault-button,
  .item-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    min-width: 0; /* lets long names shorten with "…" instead of pushing Clone out */
    padding: 0.5rem 0.6rem;
    border: 0;
    border-radius: var(--radius);
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .vault-button:hover,
  .item-row:hover {
    background: var(--color-hover);
  }

  .vault-button.is-selected,
  .item.is-selected .item-row {
    background: var(--color-selection);
  }

  /* Clone sits outside the row's highlight, outlined and a gap apart, so it reads as its own action. */
  .item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .clone {
    flex: none;
    padding: 0.3rem 0.6rem;
    font-size: 0.85rem;
  }

  .vault-button span:first-child {
    flex: 1;
  }

  .count {
    color: var(--color-ink-muted);
    font-size: 0.85rem;
  }

  .delete-vault {
    justify-content: flex-start;
  }

  .new-vault-area {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-line);
  }

  .new-vault-area input {
    width: 100%;
  }

  /* A dashed outline in the link color: the usual sign for "add one more", unlike the plain vault rows. */
  .new-vault {
    gap: 0.4rem;
    width: 100%;
    justify-content: flex-start;
    border: 1px dashed var(--color-control-border);
    color: var(--color-link);
    font-weight: 600;
  }

  .new-vault:hover {
    border-color: var(--color-link);
    color: var(--color-link);
  }

  .vaults-footer {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-top: auto;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding-left: 0.6rem;
  }

  h1 {
    font-size: 1.25rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  ul {
    flex: 1;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li.empty {
    padding: 1rem 0.6rem;
  }

  .initial {
    display: grid;
    place-items: center;
    flex: none;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: var(--radius);
    background: var(--color-accent);
    color: var(--color-on-accent);
    font-weight: 700;
  }

  .item-text {
    display: grid;
    min-width: 0;
  }

  .item-title,
  .item-subtitle {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-title {
    font-weight: 600;
  }

  .item-subtitle {
    color: var(--color-ink-muted);
    font-size: 0.85rem;
  }

  /* Phones: vaults become a strip on top; picking a login shows only that login. */
  @media (max-width: 760px) {
    .vault-screen {
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr;
    }

    .vaults {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      border-right: 0;
      border-bottom: 1px solid var(--color-line);
    }

    .vault-button,
    .new-vault {
      width: auto;
    }

    .new-vault-area {
      margin: 0;
      padding: 0;
      border: 0;
    }

    .vaults-heading {
      margin: 0 0.6rem 0 0;
    }

    .vaults-footer {
      flex-direction: row;
      margin: 0 0 0 auto;
    }

    .items {
      border-right: 0;
    }

    .detail {
      display: none;
    }

    .is-showing-detail .vaults,
    .is-showing-detail .items {
      display: none;
    }

    .is-showing-detail .detail {
      display: block;
      grid-row: 1 / -1;
    }
  }
</style>
