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

  mock.timers.tick(20 * MINUTE - 1000);
  assert.equal(onTimeUp.mock.callCount(), 0);
  assert.equal(autoLock.secondsLeft, 1);

  mock.timers.tick(1000);
  assert.equal(onTimeUp.mock.callCount(), 1);
});

test('the countdown shows the seconds left, counting down every second', () => {
  startAutoLock(() => {}, activityTarget());
  assert.equal(autoLock.secondsLeft, 20 * 60);

  mock.timers.tick(3000);
  assert.equal(autoLock.secondsLeft, 20 * 60 - 3);
});

test('a key press, click or pointer movement starts the countdown again from the top', () => {
  const onTimeUp = mock.fn();
  const window = activityTarget();
  startAutoLock(onTimeUp, window);

  for (const activity of ['keydown', 'pointerdown', 'pointermove', 'wheel']) {
    mock.timers.tick(15 * MINUTE);
    window.dispatchEvent(new Event(activity));
    assert.equal(autoLock.secondsLeft, 20 * 60, activity);
  }
  assert.equal(onTimeUp.mock.callCount(), 0);
});

test('changing the minutes starts the countdown again with the new time', () => {
  const onTimeUp = mock.fn();
  startAutoLock(onTimeUp, activityTarget());
  mock.timers.tick(10 * MINUTE);

  setAutoLockMinutes(5);
  assert.equal(autoLock.secondsLeft, 5 * 60);

  mock.timers.tick(5 * MINUTE);
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

  mock.timers.tick(20 * MINUTE);
  mock.timers.tick(60 * MINUTE);
  assert.equal(onTimeUp.mock.callCount(), 1);
  assert.equal(window.listenerCount, 0);
});

test('stopping the countdown, as locking by hand does, leaves nothing running', () => {
  const onTimeUp = mock.fn();
  const window = activityTarget();
  const stop = startAutoLock(onTimeUp, window);

  stop();
  mock.timers.tick(60 * MINUTE);
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
  mock.timers.tick(20 * MINUTE);
  assert.equal(onTimeUp.mock.callCount(), 1);
});
