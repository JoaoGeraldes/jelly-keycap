import { afterEach, beforeEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { AUTO_LOCK_MINUTES, autoLock, setAutoLockMinutes, startAutoLock, stopAutoLock } from '../src/lib/auto-lock.svelte.js';

const MINUTE = 60_000;

beforeEach(() => {
  mock.timers.enable({ apis: ['setInterval', 'Date'] });
  setAutoLockMinutes(AUTO_LOCK_MINUTES.default);
});

afterEach(() => {
  stopAutoLock();
  mock.timers.reset();
});

/**
 * Lets `ms` pass one second at a time, the way a real clock moves. Skipping
 * ahead in one go isn't the same on every Node version: on older ones, every
 * tick of a long skip sees the time at its end, and a timer stopped during the
 * skip keeps going until it's over.
 */
function wait(ms) {
  for (let passed = 0; passed < ms; passed += 1000) {
    mock.timers.tick(Math.min(1000, ms - passed));
  }
}

/** A stand-in for the browser window that counts the activity listeners added to it. */
function activityTarget() {
  const target = new EventTarget();
  target.listenerCount = 0;
  const add = target.addEventListener.bind(target);
  const remove = target.removeEventListener.bind(target);
  target.addEventListener = (...args) => (target.listenerCount++, add(...args));
  target.removeEventListener = (...args) => (target.listenerCount--, remove(...args));
  return target;
}

test('with nothing changed, the vault locks after 20 minutes, not a second before', () => {
  const onTimeUp = mock.fn();
  startAutoLock(onTimeUp, activityTarget());

  wait(20 * MINUTE - 1000);
  assert.equal(onTimeUp.mock.callCount(), 0);
  assert.equal(autoLock.secondsLeft, 1);

  wait(1000);
  assert.equal(onTimeUp.mock.callCount(), 1);
});

test('the countdown shows the seconds left, counting down every second', () => {
  startAutoLock(() => {}, activityTarget());
  assert.equal(autoLock.secondsLeft, 20 * 60);

  wait(3000);
  assert.equal(autoLock.secondsLeft, 20 * 60 - 3);
});

test('a key press, click or pointer movement starts the countdown again from the top', () => {
  const onTimeUp = mock.fn();
  const window = activityTarget();
  startAutoLock(onTimeUp, window);

  for (const activity of ['keydown', 'pointerdown', 'pointermove', 'wheel']) {
    wait(15 * MINUTE);
    window.dispatchEvent(new Event(activity));
    assert.equal(autoLock.secondsLeft, 20 * 60, activity);
  }
  assert.equal(onTimeUp.mock.callCount(), 0);
});

test('changing the minutes starts the countdown again with the new time', () => {
  const onTimeUp = mock.fn();
  startAutoLock(onTimeUp, activityTarget());
  wait(10 * MINUTE);

  setAutoLockMinutes(5);
  assert.equal(autoLock.secondsLeft, 5 * 60);

  wait(5 * MINUTE);
  assert.equal(onTimeUp.mock.callCount(), 1);
});

test('minutes are whole numbers between 1 and 1440; anything that isn’t a number is ignored', () => {
  setAutoLockMinutes('7.4');
  assert.equal(autoLock.minutes, 7);
  setAutoLockMinutes(0);
  assert.equal(autoLock.minutes, 1);
  setAutoLockMinutes(99999);
  assert.equal(autoLock.minutes, 1440);
  setAutoLockMinutes('');
  setAutoLockMinutes('soon');
  assert.equal(autoLock.minutes, 1440);
});

test('once the vault locks, nothing is left running: no more ticks and no listeners', () => {
  const onTimeUp = mock.fn();
  const window = activityTarget();
  startAutoLock(onTimeUp, window);
  assert.equal(window.listenerCount, 4);

  wait(20 * MINUTE);
  wait(60 * MINUTE);
  assert.equal(onTimeUp.mock.callCount(), 1);
  assert.equal(window.listenerCount, 0);
});

test('stopping the countdown, as locking by hand does, leaves nothing running', () => {
  const onTimeUp = mock.fn();
  const window = activityTarget();
  const stop = startAutoLock(onTimeUp, window);

  stop();
  wait(60 * MINUTE);
  assert.equal(onTimeUp.mock.callCount(), 0);
  assert.equal(window.listenerCount, 0);
  assert.equal(autoLock.secondsLeft, 0);
});

test('starting again replaces the running countdown instead of adding a second one', () => {
  const onTimeUp = mock.fn();
  const window = activityTarget();
  startAutoLock(onTimeUp, window);
  startAutoLock(onTimeUp, window);

  assert.equal(window.listenerCount, 4);
  wait(20 * MINUTE);
  assert.equal(onTimeUp.mock.callCount(), 1);
});
