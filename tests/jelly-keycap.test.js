import { afterEach, beforeEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { createJellyKeycap } from '../src/lib/jelly-keycap.js';

const LOGO = ['M0,0H24V24H0Z'];
let prefersLessMotion = false;

// Stand-ins for the few browser features the keycap uses. Animation frames
// run on mocked timers, so a test can skip ahead in time.
beforeEach(() => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  prefersLessMotion = false;
  globalThis.matchMedia = () => ({ matches: prefersLessMotion });
  globalThis.requestAnimationFrame = (draw) =>
    setTimeout(() => draw(Date.now()), 16);
  globalThis.cancelAnimationFrame = (frame) => clearTimeout(frame);
  globalThis.getComputedStyle = () => ({ getPropertyValue: () => '#0078d4' });
  globalThis.Path2D = class {
    addPath() {}
  };
});

afterEach(() => mock.timers.reset());

/** Plays `seconds` of animation, one 16 ms frame at a time. */
function playFor(seconds) {
  for (let elapsed = 0; elapsed < seconds * 1000; elapsed += 16) {
    mock.timers.tick(16);
  }
}

/** A canvas that draws nothing and counts the listeners added to it. */
function fakeCanvas() {
  const canvas = new EventTarget();
  canvas.listenerCount = 0;
  const add = canvas.addEventListener.bind(canvas);
  const remove = canvas.removeEventListener.bind(canvas);
  canvas.addEventListener = (...args) => (canvas.listenerCount++, add(...args));
  canvas.removeEventListener = (...args) => (
    canvas.listenerCount--, remove(...args)
  );
  canvas.style = {};
  canvas.getContext = () => new Proxy({}, { get: () => () => {} });
  return canvas;
}

test('a keystroke sets it wobbling, and it stops by itself once still', () => {
  const keycap = createJellyKeycap(fakeCanvas(), LOGO);
  assert.equal(keycap.isMoving, false);

  keycap.press();
  assert.equal(keycap.isMoving, true);

  playFor(5);
  assert.equal(keycap.isMoving, false);
});

test('for anyone who prefers less motion, keystrokes leave it still', () => {
  prefersLessMotion = true;
  const keycap = createJellyKeycap(fakeCanvas(), LOGO);

  keycap.press();
  assert.equal(keycap.isMoving, false);
});

test('once removed, it stops animating and stops listening to the pointer', () => {
  const canvas = fakeCanvas();
  const keycap = createJellyKeycap(canvas, LOGO);
  assert.equal(canvas.listenerCount, 3);

  keycap.press();
  keycap.destroy();
  assert.equal(keycap.isMoving, false);
  assert.equal(canvas.listenerCount, 0);
});
