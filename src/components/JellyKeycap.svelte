<!--
  The logo as a jelly keycap on the lock screen, squashed by every keystroke.
  The physics and drawing live in src/lib/jelly-keycap.js, shared with the
  landing page. Decorative only, so it's hidden from screen readers.
-->
<script>
  import { onMount } from 'svelte';
  import logoSvg from '../media/logo-symbol.svg?raw';
  import { createJellyKeycap } from '../lib/jelly-keycap.js';
  import { pathShapes } from '../lib/svg-shapes.js';

  let { keystrokes = 0 } = $props();

  let canvas;
  let keycap;

  onMount(() => {
    keycap = createJellyKeycap(canvas, pathShapes(logoSvg));
    return () => keycap.destroy();
  });

  $effect(() => {
    if (keystrokes) keycap?.press();
  });
</script>

<canvas bind:this={canvas} class="jelly-keycap" aria-hidden="true"></canvas>

<style>
  .jelly-keycap {
    width: 15rem;
    aspect-ratio: 240 / 150;
    border-bottom: 2px solid var(--color-line); /* the floor */
    cursor: grab;
    touch-action: none; /* dragging on a touch screen moves it, not the page */
  }
</style>
