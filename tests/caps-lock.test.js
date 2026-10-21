import { test } from 'node:test';
import assert from 'node:assert/strict';
import { capsLock, updateCapsLock } from '../src/lib/caps-lock.svelte.js';

/** A stand-in for a browser key event, with Caps Lock on or off. */
const keyEvent = (isCapsLockOn) => ({ getModifierState: (key) => key === 'CapsLock' && isCapsLockOn });

test('a key pressed with Caps Lock on turns the warning on', () => {
  updateCapsLock(keyEvent(true));

  assert.equal(capsLock.isOn, true);
});

test('a key pressed with Caps Lock off turns the warning off again', () => {
  updateCapsLock(keyEvent(true));
  updateCapsLock(keyEvent(false));

  assert.equal(capsLock.isOn, false);
});

test('events that can’t report Caps Lock count as off', () => {
  updateCapsLock(keyEvent(true));
  updateCapsLock({});

  assert.equal(capsLock.isOn, false);
});
