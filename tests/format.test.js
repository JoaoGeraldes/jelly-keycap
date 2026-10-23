import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatCell, formatCountdown, formatSize, formatTimestamp } from '../src/lib/format.js';

// 21 October 2026 at 21:59 UTC, which is 22:59 in Lisbon.
const TIME = Date.UTC(2026, 9, 21, 21, 59);

test('timestamps are shown as a date and time in the person’s own locale and time zone', () => {
  const inPortugal = formatTimestamp(TIME, { locale: 'pt-PT', timeZone: 'Europe/Lisbon' });
  const inNewYork = formatTimestamp(TIME, { locale: 'en-US', timeZone: 'America/New_York' });

  assert.match(inPortugal, /21/);
  assert.match(inPortugal, /2026/);
  assert.match(inPortugal, /22:59/);
  assert.match(inNewYork, /Oct 21, 2026/);
  assert.match(inNewYork, /5:59\s?PM/);
});

test('only *_at columns are treated as dates; other values are shown as stored', () => {
  const options = { locale: 'en-US', timeZone: 'UTC' };

  assert.match(formatCell('created_at', TIME, options), /Oct 21, 2026/);
  assert.equal(formatCell('id', 'abc-123', options), 'abc-123');
  assert.equal(formatCell('data_enc', null, options), 'NULL');
});

test('file sizes are shown in KB, or in MB from 1 MB up', () => {
  assert.equal(formatSize(28 * 1024), '28 KB');
  assert.equal(formatSize(1500), '2 KB');
  assert.equal(formatSize(3.5 * 1024 * 1024), '3.5 MB');
});

test('the auto-lock countdown reads like a clock, with hours only from an hour up', () => {
  assert.equal(formatCountdown(20 * 60), '20:00');
  assert.equal(formatCountdown(65), '1:05');
  assert.equal(formatCountdown(9), '0:09');
  assert.equal(formatCountdown(90 * 60), '1:30:00');
});
