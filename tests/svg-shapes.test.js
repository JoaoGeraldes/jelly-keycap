import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathShapes } from '../src/lib/svg-shapes.js';

test('both shapes of the logo are read, so the jelly keycap draws the whole logo', () => {
  const logo = readFileSync(new URL('../src/media/logo-symbol.svg', import.meta.url), 'utf8');
  const shapes = pathShapes(logo);

  assert.equal(shapes.length, 2);
  for (const shape of shapes) assert.match(shape, /^M[\d.,-]+/);
});

test('a shape is read whatever order its attributes are written in', () => {
  const svg = '<svg><path d="M0,0H1" class="a"/><path class="b" d="M2,2H3"/></svg>';

  assert.deepEqual(pathShapes(svg), ['M0,0H1', 'M2,2H3']);
});

test('an SVG with no paths has no shapes', () => {
  assert.deepEqual(pathShapes('<svg><circle r="1"/></svg>'), []);
});
