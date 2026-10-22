<!--
  The bottom-right stack of "Deleted · Undo" notes, one per entry still within its time to undo.
  Shows the newest few; Undo all covers the rest. Pointing at the stack or tabbing into it
  pauses every countdown, so there is time to read and decide.
-->
<script>
  import {
    UNDO_DELETE_MS,
    pauseDeletions,
    pendingDeletions,
    resumeDeletions,
    session,
    undoDeletion,
  } from '../lib/vault.svelte.js';

  const MAX_SHOWN = 3;

  let stack = $state();
  // Entries whose vault was deleted meanwhile are gone for good, so they get no Undo.
  const undoable = $derived(pendingDeletions.filter((pending) => session.vaults.some((vault) => vault.id === pending.item.vaultId)));
  const shown = $derived(undoable.slice(-MAX_SHOWN).reverse()); // newest on top
  const hiddenCount = $derived(undoable.length - shown.length);

  // The clicked button disappears, which can leave the countdowns paused; restart them unless still pointed at.
  function undo(itemIds) {
    for (const id of itemIds) undoDeletion(id);
    if (!stack?.matches(':hover')) resumeDeletions();
  }
</script>

{#if undoable.length}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="undo-stack"
    role="status"
    bind:this={stack}
    onmouseenter={pauseDeletions}
    onmouseleave={resumeDeletions}
    onfocusin={pauseDeletions}
    onfocusout={resumeDeletions}
  >
    {#each shown as pending (pending.item.id)}
      <div class="undo-note">
        <span class="name">“{pending.item.title}” deleted</span>
        <button class="button-quiet" onclick={() => undo([pending.item.id])}>Undo</button>
        <span class="countdown" style:animation-duration="{UNDO_DELETE_MS}ms"></span>
      </div>
    {/each}
    {#if undoable.length > 1}
      <div class="undo-all">
        <span>{hiddenCount ? `and ${hiddenCount} more` : ''}</span>
        <button class="button-quiet" onclick={() => undo(undoable.map((pending) => pending.item.id))}>Undo all</button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .undo-stack {
    position: fixed;
    right: 1rem;
    bottom: 1rem;
    z-index: 100;
    display: grid;
    gap: 0.5rem;
    width: min(20rem, 100vw - 2rem);
  }

  .undo-note,
  .undo-all {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .undo-note {
    position: relative;
    overflow: hidden;
    padding: 0.4rem 0.4rem 0.4rem 0.8rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    background: var(--color-surface);
    box-shadow: 0 4px 16px rgb(0 0 0 / 0.12);
  }

  .name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .undo-note button,
  .undo-all button {
    color: var(--color-link);
    font-weight: 600;
  }

  .undo-all {
    justify-content: space-between;
    padding-left: 0.8rem;
    color: var(--color-ink-muted);
    font-size: 0.85rem;
  }

  /* A thin bar that empties as the time to undo runs out. */
  .countdown {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 2px;
    background: var(--color-accent);
    transform-origin: left;
    animation: run-out linear forwards;
  }

  .undo-stack:hover .countdown,
  .undo-stack:focus-within .countdown {
    animation-play-state: paused;
  }

  @keyframes run-out {
    to {
      transform: scaleX(0);
    }
  }
</style>
