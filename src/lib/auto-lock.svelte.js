/**
 * Locks the vault after a number of minutes with no key presses, clicks or pointer movement,
 * and counts down to it for the top bar. The number of minutes is saved in the database (see
 * user-settings.js); until it's read, or if none was chosen, it's 20.
 *
 * There is only ever one countdown: one interval and one set of activity listeners, removed
 * again by stopAutoLock(), so locking and unlocking over and over leaves nothing behind.
 */
import { api } from './api.js';

export const AUTO_LOCK_MINUTES = { default: 20, min: 1, max: 1440 };
const ACTIVITY_EVENTS = ['keydown', 'pointerdown', 'pointermove', 'wheel'];

/** Reactive state for the UI. `secondsLeft` is 0 while no countdown is running. */
export const autoLock = $state({ minutes: AUTO_LOCK_MINUTES.default, secondsLeft: 0 });

let deadline = 0;
let stopCountdown = null; // set while a countdown is running

/**
 * Starts the countdown; any activity on `activityTarget` starts it again from the top.
 * Calls `onTimeUp` once when it runs out. Returns stopAutoLock, ready for onMount's cleanup.
 */
export function startAutoLock(onTimeUp, activityTarget = globalThis) {
  stopAutoLock();
  const interval = setInterval(() => {
    updateSecondsLeft();
    if (autoLock.secondsLeft > 0) return;
    stopAutoLock();
    onTimeUp();
  }, 1000);
  for (const name of ACTIVITY_EVENTS) activityTarget.addEventListener?.(name, restartCountdown, { passive: true });

  stopCountdown = () => {
    clearInterval(interval);
    for (const name of ACTIVITY_EVENTS) activityTarget.removeEventListener?.(name, restartCountdown);
    stopCountdown = null;
    autoLock.secondsLeft = 0;
  };
  restartCountdown();
  return stopAutoLock;
}

export function stopAutoLock() {
  stopCountdown?.();
}

/**
 * Whole minutes between the limits. Anything that isn't a number is ignored.
 * `save: false` is for the minutes just read from the database.
 */
export function setAutoLockMinutes(value, { save = true } = {}) {
  const minutes = Math.round(Number(value));
  if (value === '' || value === null || !Number.isFinite(minutes)) return;
  autoLock.minutes = Math.min(AUTO_LOCK_MINUTES.max, Math.max(AUTO_LOCK_MINUTES.min, minutes));
  if (stopCountdown) restartCountdown(); // the new time counts from now
  if (save) return api.saveUserSettings({ autoLockMinutes: autoLock.minutes }).catch(() => {}); // if not saved, still used for this visit
}

function restartCountdown() {
  deadline = Date.now() + autoLock.minutes * 60_000;
  updateSecondsLeft();
}

// Counted from the clock, not by counting ticks: browsers slow timers down in background tabs
// and a computer can sleep, but the vault must still lock on time.
function updateSecondsLeft() {
  autoLock.secondsLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}
