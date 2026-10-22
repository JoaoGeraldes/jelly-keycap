<!--
  A sneaky burglar on the lock screen, just for fun. He tiptoes back and forth until you type:
  the first keystroke (or grabbing him) knocks him over, and from then on he is a ragdoll that
  each keystroke kicks and that can be grabbed and flung. Decorative only: hidden from screen
  readers, and standing still for anyone who prefers less motion.

  The walk isn't physics: each frame, the joints are placed from a few swinging angles.
  The fall is Verlet integration: each point keeps moving by the distance it moved last frame,
  plus gravity. Sticks then pull joined points back to their length, a few times over. Without
  muscles holding it up, the body flops like a rag.
-->
<script>
  import { onMount } from "svelte";

  let { keystrokes = 0 } = $props();

  const WIDTH = 240;
  const HEIGHT = 150;
  const GRAVITY = 0.4;
  const AIR_FRICTION = 0.99;
  const FLOOR_FRICTION = 0.7;
  const STICK_PASSES = 5; // more passes make the sticks stiffer
  const HEAD_RADIUS = 9;
  const WALK_SPEED = 1; // pixels per frame
  const STRIDE_SPEED = 0.09; // how fast the legs swing
  const MASK_COLOR = "#1a1a1a"; // a burglar's mask is black in every theme

  // The body standing upright. Only its proportions matter: they set every stick's length.
  const SKELETON = {
    head: [120, 20],
    neck: [120, 38],
    pelvis: [120, 74],
    leftElbow: [104, 52],
    leftHand: [98, 70],
    rightElbow: [136, 52],
    rightHand: [142, 70],
    leftKnee: [112, 98],
    leftFoot: [110, 122],
    rightKnee: [128, 98],
    rightFoot: [130, 122],
  };
  const points = Object.fromEntries(
    Object.entries(SKELETON).map(([name, [x, y]]) => [
      name,
      { x, y, oldX: x, oldY: y },
    ]),
  );

  // [from, to, drawn thickness]. Thickness 0 is invisible: head to pelvis keeps the spine from folding.
  const sticks = [
    ["head", "neck", 6],
    ["neck", "pelvis", 11],
    ["head", "pelvis", 0],
    ["neck", "leftElbow", 6],
    ["leftElbow", "leftHand", 5],
    ["neck", "rightElbow", 6],
    ["rightElbow", "rightHand", 5],
    ["pelvis", "leftKnee", 7],
    ["leftKnee", "leftFoot", 6],
    ["pelvis", "rightKnee", 7],
    ["rightKnee", "rightFoot", 6],
  ].map(([from, to, thickness]) => ({
    from: points[from],
    to: points[to],
    thickness,
    length: bone(from, to),
  }));

  const kickOrder = [
    "head",
    "rightHand",
    "pelvis",
    "leftFoot",
    "leftHand",
    "rightFoot",
  ];

  let canvas;
  let grabbed = $state.raw(null); // raw: the point itself, not a copy, so `point === grabbed` works
  let isWalking = true;
  let walk = { x: 70, direction: 1, phase: 0 }; // direction: 1 walks right, -1 left
  let frame = null;
  let stillFrames = 0;
  const prefersStillness = matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  onMount(() => {
    placeWalkingPose();
    for (const point of Object.values(points))
      Object.assign(point, { oldX: point.x, oldY: point.y });
    if (prefersStillness) draw();
    else wake();
    return () => cancelAnimationFrame(frame);
  });

  $effect(() => {
    if (keystrokes && !prefersStillness)
      kick(points[kickOrder[keystrokes % kickOrder.length]]);
  });

  // The whole body hops a little (a kick on one point alone gets soaked up by the rest),
  // and the kicked part gets a sideways shove too, which makes it tumble.
  function kick(kickedPoint) {
    isWalking = false; // the first kick knocks him over for good
    for (const point of Object.values(points)) point.oldY = point.y + 7; // up, since "old" was below
    kickedPoint.oldX = kickedPoint.x - (Math.random() - 0.5) * 24;
    kickedPoint.oldY += 8;
    wake();
  }

  // Runs frames while he walks, and after a fall until the body has settled, then stops,
  // so a still screen costs no battery.
  function wake() {
    stillFrames = 0;
    if (frame === null) frame = requestAnimationFrame(tick);
  }

  function tick() {
    if (isWalking) {
      stepWalking();
      draw();
      frame = requestAnimationFrame(tick);
      return;
    }
    const movement = step();
    draw();
    stillFrames = movement < 0.05 && !grabbed ? stillFrames + 1 : 0;
    frame = stillFrames > 30 ? null : requestAnimationFrame(tick);
  }

  // Walks along the floor, turning round at each wall. Every point remembers where it was, so
  // when he's knocked over, the physics carries on with his walking momentum.
  function stepWalking() {
    walk.phase += STRIDE_SPEED;
    walk.x += WALK_SPEED * walk.direction;
    if (walk.x < 45 || walk.x > WIDTH - 45) walk.direction *= -1; // his hands reach ahead, so turn early
    for (const point of Object.values(points))
      Object.assign(point, { oldX: point.x, oldY: point.y });
    placeWalkingPose();
  }

  // A cartoon tiptoe: leaning forward, knees lifted high, hands raised in front.
  // Angles are in radians from straight down; positive points the way he's walking.
  function placeWalkingPose() {
    const { x, direction, phase } = walk;
    const reach = (from, angle, length) => ({
      x: from.x + Math.sin(angle) * length * direction,
      y: from.y + Math.cos(angle) * length,
    });
    const pose = { pelvis: { x, y: 0 } };
    const spine = Math.PI - 0.35; // up, leaning forward
    pose.neck = reach(pose.pelvis, spine, bone("pelvis", "neck"));
    pose.head = reach(pose.pelvis, spine, bone("pelvis", "head"));
    for (const [side, offset] of [
      ["left", 0],
      ["right", Math.PI],
    ]) {
      const swing = Math.sin(phase + offset);
      const lift = (1 + Math.cos(phase + offset)) / 2; // 1 while this leg comes forward
      const thigh = 0.2 + 0.6 * swing + 0.4 * lift;
      pose[`${side}Knee`] = reach(
        pose.pelvis,
        thigh,
        bone("pelvis", `${side}Knee`),
      );
      pose[`${side}Foot`] = reach(
        pose[`${side}Knee`],
        thigh - 0.3 - 1.3 * lift,
        bone(`${side}Knee`, `${side}Foot`),
      );
      const upperArm = 1.1 + 0.25 * Math.sin(phase + offset + Math.PI);
      pose[`${side}Elbow`] = reach(
        pose.neck,
        upperArm,
        bone("neck", `${side}Elbow`),
      );
      pose[`${side}Hand`] = reach(
        pose[`${side}Elbow`],
        upperArm + 1.3,
        bone(`${side}Elbow`, `${side}Hand`),
      );
    }
    // Stands on whichever foot is lowest.
    const raise = HEIGHT - 3 - Math.max(pose.leftFoot.y, pose.rightFoot.y);
    for (const [name, { x, y }] of Object.entries(pose))
      Object.assign(points[name], { x, y: y + raise });
  }

  /** One step of physics. Returns how far the points moved in total. */
  function step() {
    let movement = 0;
    for (const point of Object.values(points)) {
      if (point === grabbed) continue;
      const velocityX = (point.x - point.oldX) * AIR_FRICTION;
      const velocityY = (point.y - point.oldY) * AIR_FRICTION;
      point.oldX = point.x;
      point.oldY = point.y;
      point.x += velocityX;
      point.y += velocityY + GRAVITY;
      movement += Math.abs(velocityX) + Math.abs(velocityY);
    }
    for (let pass = 0; pass < STICK_PASSES; pass++) {
      for (const stick of sticks) pullToLength(stick);
      for (const point of Object.values(points)) keepInside(point);
    }
    return movement;
  }

  // Moves both ends half of the error each, so the stick is back to its length.
  function pullToLength({ from, to, length }) {
    const current = distance(from, to) || 0.001;
    const shift = (current - length) / current / 2;
    const shiftX = (to.x - from.x) * shift;
    const shiftY = (to.y - from.y) * shift;
    if (from !== grabbed) {
      from.x += shiftX;
      from.y += shiftY;
    }
    if (to !== grabbed) {
      to.x -= shiftX;
      to.y -= shiftY;
    }
  }

  function keepInside(point) {
    const radius = point === points.head ? HEAD_RADIUS : 3;
    point.x = Math.min(WIDTH - radius, Math.max(radius, point.x));
    point.y = Math.max(radius, point.y); // the ceiling
    if (point.y > HEIGHT - radius) {
      point.y = HEIGHT - radius;
      point.oldX = point.x - (point.x - point.oldX) * FLOOR_FRICTION; // slides to a stop on the floor
    }
  }

  function draw() {
    const pixelRatio = devicePixelRatio || 1;
    canvas.width = WIDTH * pixelRatio;
    canvas.height = HEIGHT * pixelRatio;
    const context = canvas.getContext("2d");
    context.scale(pixelRatio, pixelRatio);
    const style = getComputedStyle(canvas); // read every time, so it follows a theme change
    const bodyColor = style.getPropertyValue("--color-ink-muted");
    const headColor = style.getPropertyValue("--color-accent");

    context.lineCap = "round";
    for (const { from, to, thickness } of sticks) {
      if (!thickness) continue;
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.strokeStyle = bodyColor;
      context.lineWidth = thickness;
      context.stroke();
      // A thin light line along each limb makes it read as a cylinder.
      context.strokeStyle = "rgb(255 255 255 / 0.25)";
      context.lineWidth = thickness / 3;
      context.stroke();
    }

    // A highlight off-center makes the head read as a ball.
    const { x, y } = points.head;
    const shine = context.createRadialGradient(
      x - 3,
      y - 3,
      1,
      x,
      y,
      HEAD_RADIUS,
    );
    shine.addColorStop(0, "rgb(255 255 255 / 0.6)");
    shine.addColorStop(1, "rgb(255 255 255 / 0)");
    context.beginPath();
    context.arc(x, y, HEAD_RADIUS, 0, Math.PI * 2);
    context.fillStyle = headColor;
    context.fill();
    context.fillStyle = shine;
    context.fill();

    drawMask(context);
  }

  // A dark band over the eyes, with eye holes, knotted at the back of the head.
  // It turns with the head, so it stays on while he tumbles.
  function drawMask(context) {
    const { head, neck } = points;
    context.save();
    context.translate(head.x, head.y);
    context.rotate(Math.atan2(head.y - neck.y, head.x - neck.x) + Math.PI / 2); // 0 when upright
    context.scale(walk.direction, 1); // eyes to the front, knot to the back

    context.fillStyle = MASK_COLOR;
    context.beginPath();
    context.roundRect(-HEAD_RADIUS - 1, -4, HEAD_RADIUS * 2 + 2, 6, 3);
    context.fill();
    context.strokeStyle = MASK_COLOR;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(-HEAD_RADIUS, -1);
    context.lineTo(-HEAD_RADIUS - 6, -5);
    context.moveTo(-HEAD_RADIUS, -1);
    context.lineTo(-HEAD_RADIUS - 6, 3);
    context.stroke();

    for (const eyeX of [2, 6.5]) {
      context.fillStyle = "#ffffff";
      context.beginPath();
      context.arc(eyeX, -1, 1.7, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = MASK_COLOR; // pupils, glancing ahead
      context.beginPath();
      context.arc(eyeX + 0.6, -1, 0.8, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  function bone(from, to) {
    const [[fromX, fromY], [toX, toY]] = [SKELETON[from], SKELETON[to]];
    return Math.hypot(toX - fromX, toY - fromY);
  }

  function distance(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  // Pointer position in the canvas's own units, whatever size it is shown at.
  function pointerPosition(event) {
    const box = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) / box.width) * WIDTH,
      y: ((event.clientY - box.top) / box.height) * HEIGHT,
    };
  }

  function grab(event) {
    if (prefersStillness) return;
    const pointer = pointerPosition(event);
    const nearest = Object.values(points).reduce((best, point) =>
      distance(point, pointer) < distance(best, pointer) ? point : best,
    );
    if (distance(nearest, pointer) > 20) return;
    isWalking = false; // caught: from now on he's a ragdoll
    grabbed = nearest;
    canvas.setPointerCapture(event.pointerId);
    wake();
  }

  // The grabbed point follows the pointer; its old position stays behind, so letting go flings it.
  function moveGrabbed(event) {
    if (!grabbed) return;
    grabbed.oldX = grabbed.x;
    grabbed.oldY = grabbed.y;
    Object.assign(grabbed, pointerPosition(event));
  }
</script>

<canvas
  bind:this={canvas}
  class="ragdoll"
  class:is-grabbing={grabbed}
  aria-hidden="true"
  onpointerdown={grab}
  onpointermove={moveGrabbed}
  onpointerup={() => (grabbed = null)}
></canvas>

<style>
  .ragdoll {
    width: 15rem;
    aspect-ratio: 240 / 150;
    border-bottom: 2px solid var(--color-line); /* the floor */
    cursor: grab;
    touch-action: none; /* dragging on a touch screen moves him, not the page */
  }

  .is-grabbing {
    cursor: grabbing;
  }
</style>
