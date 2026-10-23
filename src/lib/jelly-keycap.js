/**
 * The logo as a jelly keycap, drawn on a <canvas>, just for fun. Every
 * keystroke smashes it and it wobbles back; type fast and it stays squashed
 * flatter. It can be grabbed, dragged and thrown. Plain JavaScript with no
 * framework, so the app (JellyKeycap.svelte) and the landing page
 * (site/index.html) share this one copy.
 *
 * The physics is kept simple on purpose. The keycap moves as one body
 * (gravity, floor, walls, throwing). Its jelly shape comes from two springs
 * that pull back to rest and slowly lose energy: one for squash (flatter and
 * wider, keeping its volume) and one for lean. Everything that sets the feel
 * is in PHYSICS below. Anyone who prefers less motion gets a still logo.
 */

// Tune the feel here. Distances are in canvas units, times in seconds.
const PHYSICS = {
  mass: 1, // heavier: presses and landings squash it less, it wobbles slower
  stiffness: 900, // how firmly the jelly springs back to shape
  damping: 12, // how quickly the wobble dies down (lower = jigglier)
  gravity: 1800, // how fast it falls
  pressStrength: 9, // how hard one keystroke smashes it
  pressStacking: 0.1, // how much flatter it stays per quick keystroke
  pressRecovery: 2.5, // how fast that held-down squash wears off, per second
  maxSquash: 0.6, // 0.6: can be pressed down to 40% of its height
  maxStretch: 0.35, // 0.35: can stretch up to 135% of its height
  impactSquash: 0.012, // how much a landing squashes it, per unit of speed
  tilt: 0.004, // how much a change of sideways speed leans it over
  bounce: 0.35, // share of speed kept when hitting the floor or a wall
  floorFriction: 6, // how quickly it stops sliding along the floor
  airFriction: 0.4, // how quickly it slows down in the air
};

// The canvas is always 240 × 150 units, whatever size it is shown at.
export const WIDTH = 240;
export const HEIGHT = 150;
const FLOOR = HEIGHT - 2;
const KEY_WIDTH = 64;
const KEY_HEIGHT = 50;
const SUBSTEPS = 4; // smaller steps keep stiff springs steady
const LANDING_SPEED = 60; // slower than this, touching the floor is resting
const SETTLED_FRAMES = 10; // still for this many frames: stop animating

// Where the logo actually sits inside its 24 × 24 viewBox (measured with
// getBBox()), so the drawing fills the keycap exactly and rests on the floor.
// Its 1.28 shape matches KEY_WIDTH / KEY_HEIGHT.
const LOGO_BOX = { x: 0.6, y: 3.09, width: 22.79, height: 17.83 };

/**
 * Starts the keycap on `canvas`, drawn from `shapes`: the logo's SVG path
 * data (each <path>'s `d`), so it always matches the logo file.
 * Returns press() for a keystroke, and destroy() to stop it for good.
 */
export function createJellyKeycap(canvas, shapes) {
  const logo = new Path2D();
  for (const shape of shapes) logo.addPath(new Path2D(shape));
  const prefersStillness = globalThis.matchMedia?.(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  // x, y: the middle of its bottom edge. squash > 0 is flatter, < 0 taller.
  // lean is in radians.
  const key = {
    x: WIDTH / 2,
    y: FLOOR,
    speedX: 0,
    speedY: 0,
    squash: 0,
    squashSpeed: 0,
    lean: 0,
    leanSpeed: 0,
  };
  let heldDown = 0; // grows with each quick keystroke, wears off over time
  let grab = null; // { pointerId, offsetX, offsetY, pointerX, pointerY }
  let frame = null;
  let lastTime = null;
  let stillFrames = 0;

  const pointerHandlers = {
    pointerdown: startGrab,
    pointermove: moveGrab,
    pointerup: (event) => letGo(event.pointerId),
  };
  for (const [name, handler] of Object.entries(pointerHandlers)) {
    canvas.addEventListener(name, handler);
  }
  draw();

  function press() {
    if (prefersStillness) return;
    heldDown += 1;
    key.squashSpeed += PHYSICS.pressStrength / PHYSICS.mass;
    // Jelly never squashes quite straight.
    key.leanSpeed += (Math.random() - 0.5) * PHYSICS.pressStrength * 0.3;
    wake();
  }

  function destroy() {
    cancelAnimationFrame(frame);
    frame = null;
    for (const [name, handler] of Object.entries(pointerHandlers)) {
      canvas.removeEventListener(name, handler);
    }
  }

  // Runs frames until it has settled, then stops, so a still screen costs no
  // battery.
  function wake() {
    stillFrames = 0;
    if (frame !== null) return;
    lastTime = null;
    frame = requestAnimationFrame(tick);
  }

  function tick(time) {
    // A slow frame can't make it jump.
    const elapsed =
      lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 1 / 30);
    lastTime = time;
    // Once per frame: the pointer only moves between frames.
    if (grab && elapsed > 0) followPointer(elapsed);
    for (let i = 0; i < SUBSTEPS; i++) step(elapsed / SUBSTEPS);
    draw();
    stillFrames = isSettled() ? stillFrames + 1 : 0;
    frame = stillFrames > SETTLED_FRAMES ? null : requestAnimationFrame(tick);
  }

  /** Moves everything forward by `seconds`. */
  function step(seconds) {
    const { mass, stiffness, damping } = PHYSICS;
    heldDown *= Math.exp(-PHYSICS.pressRecovery * seconds);
    const restSquash = Math.min(
      PHYSICS.maxSquash,
      heldDown * PHYSICS.pressStacking,
    );

    // A damped spring: pulled toward its rest shape, slowed by its own speed.
    const squashForce =
      -stiffness * (key.squash - restSquash) - damping * key.squashSpeed;
    key.squashSpeed += (squashForce / mass) * seconds;
    key.squash += key.squashSpeed * seconds;
    const leanForce = -stiffness * key.lean - damping * key.leanSpeed;
    key.leanSpeed += (leanForce / mass) * seconds;
    key.lean += key.leanSpeed * seconds;
    if (key.squash > PHYSICS.maxSquash || key.squash < -PHYSICS.maxStretch) {
      key.squash = Math.max(
        -PHYSICS.maxStretch,
        Math.min(PHYSICS.maxSquash, key.squash),
      );
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

  // Held: the keycap goes where the pointer is, and remembers how fast it
  // moved for the throw.
  function followPointer(seconds) {
    const newX = grab.pointerX - grab.offsetX;
    const newY = grab.pointerY - grab.offsetY;
    // Let go just before it reaches a wall, the ceiling or the floor: dragged
    // on past one, it would be squeezed against it and stretch oddly. It falls
    // away with the speed it had.
    const { width, height } = size();
    const isAtEdge =
      newX - width / 2 <= 0 ||
      newX + width / 2 >= WIDTH ||
      newY - height <= 0 ||
      newY > FLOOR;
    if (isAtEdge) {
      letGo(grab.pointerId);
      return;
    }
    const newSpeedX = (newX - key.x) / seconds;
    key.leanSpeed -= (newSpeedX - key.speedX) * PHYSICS.tilt; // it trails
    // Smoothed, so one jerky frame isn't the throw.
    key.speedX = key.speedX * 0.7 + newSpeedX * 0.3;
    key.speedY = key.speedY * 0.7 + ((newY - key.y) / seconds) * 0.3;
    key.x = newX;
    key.y = newY;
  }

  function bounceOffEdges(seconds) {
    const { width, height } = size();
    if (key.y > FLOOR) {
      key.y = FLOOR;
      // A real landing squashes and bounces; resting on the floor (only
      // gravity pulling) doesn't.
      if (key.speedY > LANDING_SPEED) {
        key.squashSpeed += (key.speedY * PHYSICS.impactSquash) / PHYSICS.mass;
        key.speedY = -key.speedY * PHYSICS.bounce;
      } else {
        key.speedY = 0;
      }
    }
    if (key.y >= FLOOR) {
      key.speedX *= Math.exp(-PHYSICS.floorFriction * seconds);
    }
    if (key.y - height < 0) {
      key.y = height;
      key.speedY = Math.abs(key.speedY) * PHYSICS.bounce;
    }
    const walls = [
      [width / 2, 1],
      [WIDTH - width / 2, -1],
    ];
    for (const [limit, side] of walls) {
      if ((key.x - limit) * side < 0) {
        key.x = limit;
        key.leanSpeed -= key.speedX * PHYSICS.tilt; // a knock wobbles it too
        key.speedX = Math.abs(key.speedX) * PHYSICS.bounce * side;
      }
    }
  }

  // Squashing keeps the volume: as wide as it gets flatter.
  function size() {
    const heightScale = 1 - key.squash;
    return {
      width: KEY_WIDTH / heightScale,
      height: KEY_HEIGHT * heightScale,
    };
  }

  function isSettled() {
    const movement = Math.abs(key.speedX) + Math.abs(key.speedY);
    const wobble =
      Math.abs(key.squash) +
      Math.abs(key.squashSpeed) +
      Math.abs(key.lean) +
      Math.abs(key.leanSpeed);
    return (
      !grab &&
      key.y >= FLOOR &&
      heldDown < 0.05 &&
      movement < 1 &&
      wobble < 0.005
    );
  }

  function draw() {
    // Sized to the pixels it is shown at, so it stays sharp at any size.
    const shownWidth = canvas.clientWidth || WIDTH;
    const scale = (shownWidth / WIDTH) * (globalThis.devicePixelRatio || 1);
    canvas.width = Math.round(WIDTH * scale);
    canvas.height = Math.round(HEIGHT * scale);
    const context = canvas.getContext('2d');
    context.scale(scale, scale);
    // Read every time, so it follows a theme change.
    const jellyColor =
      getComputedStyle(canvas).getPropertyValue('--color-accent');
    const { width, height } = size();

    // A shadow on the floor, smaller and fainter the higher it flies.
    const flight = Math.min(1, (FLOOR - key.y) / HEIGHT);
    context.fillStyle = `rgb(0 0 0 / ${0.18 * (1 - flight)})`;
    context.beginPath();
    const shadowWidth = (width / 2) * (1 - flight * 0.5);
    context.ellipse(key.x, FLOOR, shadowWidth, 3, 0, 0, Math.PI * 2);
    context.fill();

    // Drawn around the middle of the bottom edge, so it squashes onto the
    // floor and leans from there.
    context.translate(key.x, key.y);
    context.transform(1, 0, -Math.tan(key.lean), 1, 0, 0);
    context.translate(-width / 2, -height);
    // Squashing stretches the logo too.
    context.scale(width / LOGO_BOX.width, height / LOGO_BOX.height);
    context.translate(-LOGO_BOX.x, -LOGO_BOX.y);

    context.globalAlpha = 0.85; // jelly is a little see-through
    context.fillStyle = jellyColor;
    context.fill(logo);
  }

  // Pointer position in the canvas's own units, whatever size it is shown at.
  function pointerPosition(event) {
    const box = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) / box.width) * WIDTH,
      y: ((event.clientY - box.top) / box.height) * HEIGHT,
    };
  }

  function startGrab(event) {
    if (prefersStillness) return;
    const pointer = pointerPosition(event);
    const { width, height } = size();
    const isOnKeycap =
      Math.abs(pointer.x - key.x) <= width / 2 &&
      pointer.y >= key.y - height &&
      pointer.y <= key.y;
    if (!isOnKeycap) return;
    grab = {
      pointerId: event.pointerId,
      offsetX: pointer.x - key.x,
      offsetY: pointer.y - key.y,
      pointerX: pointer.x,
      pointerY: pointer.y,
    };
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'grabbing';
    wake();
  }

  // Reaching the edge of the box lets go, as if dropped: dragging on past it
  // would pin the keycap against a wall while the pointer keeps going, and
  // fling it on release.
  function moveGrab(event) {
    if (!grab) return;
    const pointer = pointerPosition(event);
    const isInside =
      pointer.x > 0 && pointer.x < WIDTH && pointer.y > 0 && pointer.y < HEIGHT;
    if (!isInside) return letGo(event.pointerId);
    grab.pointerX = pointer.x;
    grab.pointerY = pointer.y;
  }

  function letGo(pointerId) {
    grab = null;
    canvas.style.cursor = '';
    if (canvas.hasPointerCapture(pointerId)) {
      canvas.releasePointerCapture(pointerId);
    }
  }

  return {
    press,
    destroy,
    /** Whether it is animating right now (it stops once settled). */
    get isMoving() {
      return frame !== null;
    },
  };
}
