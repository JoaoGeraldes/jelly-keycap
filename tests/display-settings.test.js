import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEXT_SCALE, loadDisplaySettings, nextTextScale } from '../src/lib/display-settings.js';

test('text size changes in 10% steps without rounding errors', () => {
  assert.equal(nextTextScale(1, 1), 1.1);
  assert.equal(nextTextScale(1.1, 1), 1.2);
  assert.equal(nextTextScale(1, -1), 0.9);
});

test('text size stops at the smallest and largest limits', () => {
  assert.equal(nextTextScale(TEXT_SCALE.max, 1), TEXT_SCALE.max);
  assert.equal(nextTextScale(TEXT_SCALE.min, -1), TEXT_SCALE.min);
});

test('with nothing saved and no system preference, text is normal size and the theme is light', () => {
  assert.deepEqual(loadDisplaySettings(), { textScale: 1, theme: 'light' });
});
