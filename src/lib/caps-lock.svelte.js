/**
 * Whether Caps Lock is on, so password forms can warn about it.
 * Browsers only report it with a key event, so it updates on every key press or release.
 */
export const capsLock = $state({ isOn: false });

export function updateCapsLock(keyEvent) {
  capsLock.isOn = keyEvent.getModifierState?.('CapsLock') ?? false;
}

// The ?. keeps this importable outside a browser, as in the tests.
globalThis.addEventListener?.('keydown', updateCapsLock);
globalThis.addEventListener?.('keyup', updateCapsLock);
