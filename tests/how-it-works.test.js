import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connections, nodes } from '../src/lib/how-it-works.js';

const nodeIds = nodes.map((node) => node.id);

test('every node has a unique id, a title and a note', () => {
  assert.equal(new Set(nodeIds).size, nodes.length);
  for (const node of nodes) {
    assert.ok(node.title && node.note, node.id);
  }
});

test('every arrow goes from one existing node to another', () => {
  for (const [fromId, toId] of connections) {
    assert.ok(nodeIds.includes(fromId), `unknown node "${fromId}"`);
    assert.ok(nodeIds.includes(toId), `unknown node "${toId}"`);
  }
});

test('every node is connected to at least one other', () => {
  const connectedIds = new Set(connections.flat());
  for (const id of nodeIds) {
    assert.ok(connectedIds.has(id), `"${id}" has no arrows`);
  }
});

test('no two nodes start in the same place', () => {
  const positions = nodes.map((node) => `${node.x},${node.y}`);
  assert.equal(new Set(positions).size, nodes.length);
});
