<!--
  A jelly keycap on the lock screen, just for fun. Every keystroke smashes it and it wobbles
  back; type fast and it stays squashed flatter. It can be grabbed, dragged and thrown.
  Decorative only: hidden from screen readers, and still for anyone who prefers less motion.

  The physics is kept simple on purpose. The keycap moves as one body (gravity, floor, walls,
  throwing). Its jelly shape comes from two springs that pull back to rest and slowly lose
  energy: one for squash (flatter and wider, keeping its volume) and one for lean.
  Everything that sets the feel is in PHYSICS below.
-->
<script>
  import { onMount } from "svelte";

  let { keystrokes = 0 } = $props();

  // Tune the feel here. Distances are in canvas pixels, times in seconds.
  const PHYSICS = {
    mass: 1, // heavier: presses squash it less, landings less, and it wobbles slower
    stiffness: 900, // how firmly the jelly springs back to shape
    damping: 12, // how quickly the wobble dies down (lower = jigglier)
    gravity: 1800, // how fast it falls
    pressStrength: 9, // how hard one keystroke smashes it
    pressStacking: 0.1, // how much flatter it stays per quick keystroke (0 = never stays down)
    pressRecovery: 2.5, // how fast that held-down squash wears off, per second
    maxSquash: 0.6, // 0.6: can be pressed down to 40% of its height
    maxStretch: 0.35, // 0.35: can stretch up to 135% of its height
    impactSquash: 0.012, // how much a landing squashes it, per pixel per second of speed
    tilt: 0.004, // how much a change of sideways speed leans it over
    bounce: 0.35, // share of speed kept when hitting the floor or a wall
    floorFriction: 6, // how quickly it stops sliding along the floor
    airFriction: 0.4, // how quickly it slows down in the air
  };

  const WIDTH = 240;
  const HEIGHT = 150;
  const FLOOR = HEIGHT - 2;
  const KEY_WIDTH = 64;
  const KEY_HEIGHT = 50;
  const SUBSTEPS = 4; // smaller steps keep stiff springs steady
  const LANDING_SPEED = 60; // slower than this, touching the floor is resting, not landing

  // x, y: the middle of its bottom edge. squash > 0 is flatter, < 0 taller. lean in radians.
  const key = { x: WIDTH / 2, y: FLOOR, speedX: 0, speedY: 0, squash: 0, squashSpeed: 0, lean: 0, leanSpeed: 0 };
  let heldDown = 0; // grows with each quick keystroke, wears off over time
  let grab = $state.raw(null); // { pointerId, offsetX, offsetY, pointerX, pointerY } while held
  let canvas;
  let frame = null;
  let lastTime = 0;
  let stillFrames = 0;
  const prefersStillness = matchMedia("(prefers-reduced-motion: reduce)").matches;

  onMount(() => {
    draw();
    return () => cancelAnimationFrame(frame);
  });

  $effect(() => {
    if (keystrokes && !prefersStillness) press();
  });

  function press() {
    heldDown += 1;
    key.squashSpeed += PHYSICS.pressStrength / PHYSICS.mass;
    key.leanSpeed += (Math.random() - 0.5) * PHYSICS.pressStrength * 0.3; // jelly never squashes quite straight
    wake();
  }

  // Runs frames until it has settled, then stops, so a still screen costs no battery.
  function wake() {
    stillFrames = 0;
    if (frame === null) {
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }

  function tick(time) {
    const elapsed = Math.min((time - lastTime) / 1000, 1 / 30); // a slow frame can't make it jump
    lastTime = time;
    if (grab) followPointer(elapsed); // once per frame: the pointer only moves between frames
    for (let i = 0; i < SUBSTEPS; i++) step(elapsed / SUBSTEPS);
    draw();
    stillFrames = isSettled() ? stillFrames + 1 : 0;
    frame = stillFrames > 10 ? null : requestAnimationFrame(tick);
  }

  /** Moves everything forward by `seconds`. */
  function step(seconds) {
    const { mass, stiffness, damping } = PHYSICS;
    heldDown *= Math.exp(-PHYSICS.pressRecovery * seconds);
    const restSquash = Math.min(PHYSICS.maxSquash, heldDown * PHYSICS.pressStacking);

    // A damped spring: pulled toward its rest shape, slowed by its own speed.
    key.squashSpeed += ((-stiffness * (key.squash - restSquash) - damping * key.squashSpeed) / mass) * seconds;
    key.squash += key.squashSpeed * seconds;
    key.leanSpeed += ((-stiffness * key.lean - damping * key.leanSpeed) / mass) * seconds;
    key.lean += key.leanSpeed * seconds;
    if (key.squash > PHYSICS.maxSquash || key.squash < -PHYSICS.maxStretch) {
      key.squash = Math.max(-PHYSICS.maxStretch, Math.min(PHYSICS.maxSquash, key.squash));
      key.squashSpeed = 0;
    }

    if (!grab) {
      key.speedY += PHYSICS.gravity * seconds;
      const slowing = Math.exp(-PHYSICS.airFriction * seconds);
      key.speedX *= slowing;
      key.speedY *= slowing;
      key.x += key.speedX * seconds;
      key.y += key.speedY * seconds;
    }
    bounceOffEdges(seconds);
  }

  // Held: the keycap goes where the pointer is, and remembers how fast it moved for the throw.
  function followPointer(seconds) {
    const newX = grab.pointerX - grab.offsetX;
    const newY = grab.pointerY - grab.offsetY;
    // Let go just before it reaches a wall, the ceiling or the floor: dragged on past one, it
    // would be squeezed against it and stretch oddly. It falls away with the speed it had.
    const { width, height } = size();
    if (newX - width / 2 <= 0 || newX + width / 2 >= WIDTH || newY - height <= 0 || newY > FLOOR) {
      letGo(grab.pointerId);
      return;
    }
    const newSpeedX = (newX - key.x) / seconds;
    key.leanSpeed -= (newSpeedX - key.speedX) * PHYSICS.tilt; // it trails behind the movement
    key.speedX = key.speedX * 0.7 + newSpeedX * 0.3; // smoothed, so one jerky frame isn't the throw
    key.speedY = key.speedY * 0.7 + ((newY - key.y) / seconds) * 0.3;
    key.x = newX;
    key.y = newY;
  }

  function bounceOffEdges(seconds) {
    const { width, height } = size();
    if (key.y > FLOOR) {
      key.y = FLOOR;
      // A real landing squashes and bounces; resting on the floor (only gravity pulling) doesn't.
      if (key.speedY > LANDING_SPEED) {
        key.squashSpeed += (key.speedY * PHYSICS.impactSquash) / PHYSICS.mass;
        key.speedY = -key.speedY * PHYSICS.bounce;
      } else {
        key.speedY = 0;
      }
    }
    if (key.y >= FLOOR) key.speedX *= Math.exp(-PHYSICS.floorFriction * seconds);
    if (key.y - height < 0) {
      key.y = height;
      key.speedY = Math.abs(key.speedY) * PHYSICS.bounce;
    }
    for (const [limit, side] of [[width / 2, 1], [WIDTH - width / 2, -1]]) {
      if ((key.x - limit) * side < 0) {
        key.x = limit;
        key.leanSpeed -= key.speedX * PHYSICS.tilt; // a knock on a wall wobbles it too
        key.speedX = Math.abs(key.speedX) * PHYSICS.bounce * side;
      }
    }
  }

  // Squashing keeps the volume: as wide as it gets flatter.
  function size() {
    const heightScale = 1 - key.squash;
    return { width: KEY_WIDTH / heightScale, height: KEY_HEIGHT * heightScale };
  }

  function isSettled() {
    return (
      !grab &&
      key.y >= FLOOR &&
      heldDown < 0.05 &&
      Math.abs(key.speedX) + Math.abs(key.speedY) < 1 &&
      Math.abs(key.squash) + Math.abs(key.squashSpeed) + Math.abs(key.lean) + Math.abs(key.leanSpeed) < 0.005
    );
  }

  function draw() {
    const pixelRatio = devicePixelRatio || 1;
    canvas.width = WIDTH * pixelRatio;
    canvas.height = HEIGHT * pixelRatio;
    const context = canvas.getContext("2d");
    context.scale(pixelRatio, pixelRatio);
    const style = getComputedStyle(canvas); // read every time, so it follows a theme change
    const jellyColor = style.getPropertyValue("--color-accent");
    const legendColor = style.getPropertyValue("--color-on-accent");
    const { width, height } = size();

    // A shadow on the floor, smaller and fainter the higher it flies.
    const flight = Math.min(1, (FLOOR - key.y) / HEIGHT);
    context.fillStyle = `rgb(0 0 0 / ${0.18 * (1 - flight)})`;
    context.beginPath();
    context.ellipse(key.x, FLOOR, (width / 2) * (1 - flight * 0.5), 3, 0, 0, Math.PI * 2);
    context.fill();

    // Drawn around the middle of the bottom edge, so it squashes onto the floor and leans from there.
    context.translate(key.x, key.y);
    context.transform(1, 0, -Math.tan(key.lean), 1, 0, 0);
    const left = -width / 2;
    const top = -height;
    const radius = Math.min(10, height / 3);

    context.globalAlpha = 0.85; // jelly is a little see-through
    context.fillStyle = jellyColor;
    context.beginPath();
    context.roundRect(left, top, width, height, radius); // the sides of the keycap
    context.fill();
    context.fillStyle = "rgb(0 0 0 / 0.18)";
    context.fill();

    const inset = width * 0.12;
    context.fillStyle = jellyColor;
    context.beginPath();
    context.roundRect(left + inset, top + height * 0.08, width - inset * 2, height * 0.68, radius * 0.8); // the top
    context.fill();
    context.fillStyle = "rgb(255 255 255 / 0.18)";
    context.fill();

    context.globalAlpha = 1;
    context.fillStyle = "rgb(255 255 255 / 0.45)"; // a glossy shine
    context.beginPath();
    context.ellipse(left + inset + width * 0.16, top + height * 0.2, width * 0.1, height * 0.06, -0.3, 0, Math.PI * 2);
    context.fill();

    // The legend: a password's hidden character.
    context.fillStyle = legendColor;
    context.font = `bold ${Math.round(height * 0.5)}px system-ui, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("*", 0, top + height * 0.48);
  }

  // Pointer position in the canvas's own units, whatever size it is shown at.
  function pointerPosition(event) {
    const box = canvas.getBoundingClientRect();
    return { x: ((event.clientX - box.left) / box.width) * WIDTH, y: ((event.clientY - box.top) / box.height) * HEIGHT };
  }

  function startGrab(event) {
    if (prefersStillness) return;
    const pointer = pointerPosition(event);
    const { width, height } = size();
    if (Math.abs(pointer.x - key.x) > width / 2 || pointer.y < key.y - height || pointer.y > key.y) return;
    grab = { pointerId: event.pointerId, offsetX: pointer.x - key.x, offsetY: pointer.y - key.y, pointerX: pointer.x, pointerY: pointer.y };
    canvas.setPointerCapture(event.pointerId);
    wake();
  }

  // Reaching the edge of the box lets go, as if dropped: dragging on past it would pin the
  // keycap against a wall while the pointer keeps going, and fling it on release.
  function moveGrab(event) {
    if (!grab) return;
    const pointer = pointerPosition(event);
    const isInside = pointer.x > 0 && pointer.x < WIDTH && pointer.y > 0 && pointer.y < HEIGHT;
    if (isInside) grab = { ...grab, pointerX: pointer.x, pointerY: pointer.y };
    else letGo(event.pointerId);
  }

  function letGo(pointerId) {
    grab = null;
    if (canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
  }
</script>

<canvas
  bind:this={canvas}
  class="jelly-keycap"
  class:is-grabbing={grab}
  aria-hidden="true"
  onpointerdown={startGrab}
  onpointermove={moveGrab}
  onpointerup={(event) => letGo(event.pointerId)}
></canvas>

<style>
  .jelly-keycap {
    width: 15rem;
    aspect-ratio: 240 / 150;
    border-bottom: 2px solid var(--color-line); /* the floor */
    cursor: grab;
    touch-action: none; /* dragging on a touch screen moves the keycap, not the page */
  }

  .is-grabbing {
    cursor: grabbing;
  }
</style>
