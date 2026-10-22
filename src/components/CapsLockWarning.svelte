<!-- A small notice under password fields while Caps Lock is on. -->
<script>
  import { textFor } from '../lib/i18n.svelte.js';
  import { capsLock } from '../lib/caps-lock.svelte.js';

  const text = textFor('CapsLockWarning');
</script>

<!-- role="status" lets screen readers announce it when it appears. -->
<p class="caps-lock-warning" role="status">
  {#if capsLock.isOn}{text.capsLockIsOn}{/if}
</p>

<style>
  .caps-lock-warning {
    color: var(--color-accent);
    font-size: 0.85rem;
    font-weight: 600;
  }
</style>
