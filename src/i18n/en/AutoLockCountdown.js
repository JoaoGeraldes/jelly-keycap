// Texts of src/components/AutoLockCountdown.svelte.
export default {
  changeAutoLock: 'Auto-lock: change it in Settings',
  locksIn: (time) => `Locks automatically in ${time}. Click to change it in Settings.`,
  lockedReason: (minutes) => `Locked after ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} without any activity.`,
};
