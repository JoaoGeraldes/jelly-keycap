import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEXT_SCALE, displaySettings, nextTextScale, updateDisplaySettings } from '../src/lib/display-settings.svelte.js';

test('text size changes in 10% steps without rounding errors', () => {
  assert.equal(nextTextScale(1, 1), 1.1);
  assert.equal(nextTextScale(1.1, 1), 1.2);
  assert.equal(nextTextScale(1, -1), 0.9);
});

test('text size stops at the smallest and largest limits', () => {
  assert.equal(nextTextScale(TEXT_SCALE.max, 1), TEXT_SCALE.max);
  assert.equal(nextTextScale(TEXT_SCALE.min, -1), TEXT_SCALE.min);
});

test('with nothing chosen and no system preference, text is normal size and the theme is light', () => {
  assert.deepEqual({ ...displaySettings }, { textScale: 1, theme: 'light' });
});

test('a text size outside the limits or an unknown theme is ignored, and nothing chosen changes nothing', () => {
  updateDisplaySettings({ textScale: 1.2, theme: 'dark' }, { save: false });
  updateDisplaySettings({ textScale: 5, theme: 'purple' }, { save: false });
  updateDisplaySettings({ textScale: null, theme: null }, { save: false });

  assert.deepEqual({ ...displaySettings }, { textScale: 1.2, theme: 'dark' });
});
