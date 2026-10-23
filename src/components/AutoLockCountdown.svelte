<!--
  The time left before the vault locks itself, shown next to the logo. A click opens Settings,
  where the number of minutes is chosen. Only shown while the vault is unlocked, and the
  countdown lives exactly as long as this does: it starts when this appears and stops when it
  goes, however the vault gets locked.
-->
<script>
  import { onMount } from "svelte";
  import { autoLock, startAutoLock } from "../lib/auto-lock.svelte.js";
  import { formatCountdown } from "../lib/format.js";
  import { textFor } from "../lib/i18n.svelte.js";
  import { lock } from "../lib/vault.svelte.js";

  let { onOpenSettings } = $props();

  const text = textFor("AutoLockCountdown");
  const time = $derived(formatCountdown(autoLock.secondsLeft));

  onMount(() => startAutoLock(() => lock(text.lockedReason(autoLock.minutes))));
</script>

<!-- The name stays the same while the time changes, so screen readers don't repeat it every second. -->
<button
  class="button-quiet auto-lock-countdown"
  aria-label={text.changeAutoLock}
  title={text.locksIn(time)}
  onclick={onOpenSettings}
>
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <rect x="3" y="7" width="10" height="7" rx="1.5" />
    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
  </svg>
  {time}
</button>

<style>
  /* In px, like the rest of the top bar (see .top-bar in App.svelte). */
  .auto-lock-countdown {
    gap: 6px;
    min-height: 32px;
    padding: 0 10px;
    font-size: 14px;
    font-variant-numeric: tabular-nums; /* every digit the same width, so it doesn't jiggle */
  }

  svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
  }
</style>
