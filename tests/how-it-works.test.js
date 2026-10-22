import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { diagrams } from '../src/lib/how-it-works.js';
import english from '../src/i18n/en/HowItWorks.js';

const [simple, technical] = diagrams;

for (const { id, nodes, connections } of diagrams) {
  describe(`the ${id} diagram`, () => {
    const nodeIds = nodes.map((node) => node.id);
    const text = english[id]; // other languages are checked against English in i18n.test.js

    test('every node has a unique id, a title, a note and a kind the legend explains', () => {
      assert.equal(new Set(nodeIds).size, nodes.length);
      for (const node of nodes) {
        assert.ok(text.nodes[node.id]?.title && text.nodes[node.id]?.note, node.id);
        assert.ok(text.legend[node.kind], `"${node.id}" has a kind with no legend`);
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
  });
}

test('the Simple diagram has fewer nodes than the Technical one', () => {
  assert.ok(simple.nodes.length < technical.nodes.length);
});

test('every Technical algorithm links to its documentation over https', () => {
  for (const node of technical.nodes.filter((node) => node.kind === 'step')) {
    assert.ok(node.docs?.length, `"${node.id}" has no documentation link`);
    for (const link of node.docs) {
      assert.ok(link.title, node.id);
      assert.match(link.url, /^https:\/\//, node.id);
    }
  }
});
