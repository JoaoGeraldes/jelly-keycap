<!-- A small notice under password fields while Caps Lock is on. -->
<script>
  import { capsLock } from '../lib/caps-lock.svelte.js';
</script>

<!-- role="status" lets screen readers announce it when it appears. -->
<p class="caps-lock-warning" role="status">
  {#if capsLock.isOn}⇪ Caps Lock is on{/if}
</p>

<style>
  .caps-lock-warning {
    color: var(--color-accent);
    font-size: 0.85rem;
    font-weight: 600;
  }
</style>
