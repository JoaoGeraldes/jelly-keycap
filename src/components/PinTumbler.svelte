<!--
  A pin tumbler lock seen from the side, just for fun. Each keystroke makes a pin jump; pointing
  at it jiggles them all. While unlocking, every pin rises to the shear line (the dashed line),
  which is exactly what a real key does: with no pin crossing that line, the lock can turn.
  Decorative only: hidden from screen readers, and still for anyone who prefers less motion.
-->
<script>
  let { keystrokes = 0, isUnlocking = false } = $props();

  const SHEAR_LINE = 60; // where the plug (bottom) meets the housing (top)
  const PIN_BOTTOM = 100; // pins rest here, at the bottom of the plug, when there's no key
  const DRIVER_LENGTH = 30; // long enough to cross the shear line at rest, which is what keeps it locked
  const SPRING_TOP = 6;
  const BUMP = 12;
  // Different lengths, like the cuts of a real key.
  const pins = [20, 32, 14, 26, 18].map((keyPinLength, index) => {
    const restTop = PIN_BOTTOM - keyPinLength - DRIVER_LENGTH; // top of the driver pin at rest
    return { x: 22 + index * 36, keyPinLength, restTop, lift: PIN_BOTTOM - keyPinLength - SHEAR_LINE };
  });

  let pinElements = [];
  let springElements = [];

  // Steps through the pins in a jumbled order, so typing feels lively rather than left to right.
  $effect(() => {
    if (keystrokes) bump((keystrokes * 3) % pins.length);
  });

  function bump(index, delay = 0) {
    if (isUnlocking || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const springHeight = pins[index].restTop - SPRING_TOP;
    const timing = { duration: 380, delay, easing: 'ease-out' };
    pinElements[index].animate(
      [{ transform: 'none' }, { transform: `translateY(${-BUMP}px)` }, { transform: 'translateY(2px)' }, { transform: 'none' }],
      timing,
    );
    springElements[index].animate(
      [{ transform: 'none' }, { transform: `scaleY(${(springHeight - BUMP) / springHeight})` }, { transform: 'none' }],
      timing,
    );
  }

  function jiggleAll() {
    pins.forEach((_, index) => bump(index, index * 40));
  }
</script>

<svg class="pin-tumbler" class:is-unlocking={isUnlocking} viewBox="0 0 200 116" aria-hidden="true" onpointerenter={jiggleAll}>
  <rect class="housing" x="2" y="2" width="196" height={SHEAR_LINE - 2} />
  <rect class="plug" x="2" y={SHEAR_LINE} width="196" height="52" />
  <line class="shear-line" x1="2" y1={SHEAR_LINE} x2="198" y2={SHEAR_LINE} />

  {#each pins as pin, index}
    <!-- The spring shrinks by exactly as much as the pins rise, so they always touch. -->
    <rect
      bind:this={springElements[index]}
      class="spring"
      x={pin.x + 3}
      y={SPRING_TOP}
      width="8"
      height={pin.restTop - SPRING_TOP}
      style:transform={isUnlocking ? `scaleY(${(pin.restTop - pin.lift - SPRING_TOP) / (pin.restTop - SPRING_TOP)})` : 'none'}
    />
    <g bind:this={pinElements[index]} class="pin" style:transform={isUnlocking ? `translateY(${-pin.lift}px)` : 'none'}>
      <rect class="driver-pin" x={pin.x} y={pin.restTop} width="14" height={DRIVER_LENGTH} rx="2" />
      <rect class="key-pin" x={pin.x} y={PIN_BOTTOM - pin.keyPinLength} width="14" height={pin.keyPinLength} rx="2" />
    </g>
  {/each}
</svg>

<style>
  .pin-tumbler {
    width: 11rem;
    overflow: visible;
  }

  .housing,
  .plug {
    fill: var(--color-surface);
    stroke: var(--color-line);
  }

  .plug {
    fill: var(--color-control);
  }

  .shear-line {
    stroke: var(--color-accent);
    stroke-dasharray: 4 3;
  }

  .spring {
    fill: none;
    stroke: var(--color-ink-muted);
    stroke-dasharray: 2 2;
    transform-box: fill-box;
    transform-origin: top;
  }

  .driver-pin {
    fill: var(--color-ink-muted);
  }

  .key-pin {
    fill: var(--color-accent);
  }

  /* CSS transitions keep moving even while the password check keeps JavaScript busy. */
  .pin,
  .spring {
    transition: transform 0.5s cubic-bezier(0.3, 1.4, 0.5, 1);
  }

  @media (prefers-reduced-motion: reduce) {
    .pin,
    .spring {
      transition: none;
    }
  }
</style>
