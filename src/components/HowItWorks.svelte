<!--
  A node diagram of how the master password becomes keys and how data is encrypted,
  in two tabs: Simple (everyday words) and Technical.
  Nodes can be dragged; arrows follow. Hover or focus a node to read its note; the note stays
  open while the cursor is on it, so its documentation links can be clicked.
  The diagrams' shape lives in src/lib/how-it-works.js, their words in src/i18n/<language>/HowItWorks.js.
-->
<script>
  import { diagrams } from '../lib/how-it-works.js';
  import { textFor } from '../lib/i18n.svelte.js';

  let { onClose } = $props();

  const text = textFor('HowItWorks');

  const NODE_WIDTH = 160;
  const NODE_HEIGHT = 44;
  const NOTE_ROOM = 140; // space under the lowest node, so its note isn't cut off

  // A copy of every diagram's nodes, so dragged positions survive switching tabs.
  let nodesByDiagram = $state(diagrams.map((diagram) => diagram.nodes.map((node) => ({ ...node }))));
  let diagramIndex = $state(0);
  let highlightedId = $state(null);
  let drag = null; // { node, zoom, offsetX, offsetY } while a node is being dragged

  const diagram = $derived(diagrams[diagramIndex]);
  const diagramText = $derived(text[diagram.id]); // name, legend and node texts
  const nodes = $derived(nodesByDiagram[diagramIndex]);
  const nodesById = $derived(Object.fromEntries(nodes.map((node) => [node.id, node])));
  const canvasWidth = $derived(Math.max(...nodes.map((node) => node.x)) + NODE_WIDTH);
  const canvasHeight = $derived(Math.max(...nodes.map((node) => node.y)) + NODE_HEIGHT + NOTE_ROOM);

  // A curve from the middle of one node's right edge to the middle of the other's left edge.
  function arrowPath(from, to) {
    const [startX, startY] = [from.x + NODE_WIDTH, from.y + NODE_HEIGHT / 2];
    const [endX, endY] = [to.x, to.y + NODE_HEIGHT / 2];
    const bend = Math.max(40, Math.abs(endX - startX) / 2);
    return `M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`;
  }

  // The canvas is zoomed by the text size setting, so cursor movement is divided by that zoom
  // to keep the node under the cursor.
  function startDrag(event, node) {
    event.currentTarget.setPointerCapture(event.pointerId);
    const zoom = Number(getComputedStyle(document.documentElement).getPropertyValue('--text-scale')) || 1;
    drag = { node, zoom, offsetX: event.clientX / zoom - node.x, offsetY: event.clientY / zoom - node.y };
  }

  function moveDrag(event) {
    if (!drag) return;
    drag.node.x = Math.max(0, event.clientX / drag.zoom - drag.offsetX);
    drag.node.y = Math.max(0, event.clientY / drag.zoom - drag.offsetY);
  }
</script>

<div class="how-it-works">
  <header>
    <h1>{text.title}</h1>
    <button class="button-quiet" onclick={onClose}>{text.close}</button>
  </header>

  <nav aria-label={text.levelOfDetail}>
    {#each diagrams as { id }, index}
      <button class="button" class:is-selected={index === diagramIndex} onclick={() => (diagramIndex = index)}>
        {text[id].name}
      </button>
    {/each}
  </nav>

  <p class="legend">
    {#each Object.entries(diagramText.legend) as [kind, label]}
      <span class="swatch kind-{kind}"></span>{label}
    {/each}
  </p>

  <div class="canvas-scroll">
    <div class="canvas" style:width="{canvasWidth}px" style:height="{canvasHeight}px">
      <svg width={canvasWidth} height={canvasHeight} aria-hidden="true">
        <defs>
          {#each ['arrow', 'arrow-highlighted'] as id}
            <marker {id} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
          {/each}
        </defs>
        {#each diagram.connections as [fromId, toId]}
          {@const isHighlighted = highlightedId === fromId || highlightedId === toId}
          <path
            class:is-highlighted={isHighlighted}
            d={arrowPath(nodesById[fromId], nodesById[toId])}
            marker-end="url(#{isHighlighted ? 'arrow-highlighted' : 'arrow'})"
          />
        {/each}
      </svg>

      {#each nodes as node (node.id)}
        <div
          class="node"
          role="group"
          style:left="{node.x}px"
          style:top="{node.y}px"
          onpointerenter={() => (highlightedId = node.id)}
          onpointerleave={() => (highlightedId = null)}
          onfocusin={() => (highlightedId = node.id)}
          onfocusout={() => (highlightedId = null)}
        >
          <button
            type="button"
            class="node-title kind-{node.kind}"
            style:width="{NODE_WIDTH}px"
            style:height="{NODE_HEIGHT}px"
            onpointerdown={(event) => startDrag(event, node)}
            onpointermove={moveDrag}
            onpointerup={() => (drag = null)}
          >
            {diagramText.nodes[node.id].title}
          </button>
          <div class="note" role="tooltip">
            {diagramText.nodes[node.id].note}
            {#each node.docs ?? [] as link}
              <a href={link.url} target="_blank" rel="noopener noreferrer">{link.title}</a>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .how-it-works {
    display: grid;
    gap: 1rem;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  h1 {
    font-size: 1.5rem;
  }

  nav {
    display: flex;
    gap: 0.5rem;
  }

  .is-selected {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 0.5rem;
    color: var(--color-ink-muted);
    font-size: 0.85rem;
  }

  .swatch {
    width: 0.8rem;
    height: 0.8rem;
    margin-left: 0.6rem;
    border: 2px solid;
    border-radius: 3px;
  }

  .canvas-scroll {
    overflow: auto;
    padding: 1rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    background: var(--color-surface);
  }

  /* Nodes are placed in pixels, so the whole canvas is zoomed with the text size setting.
     Its text is set in px for the same reason, so it isn't enlarged twice. */
  .canvas {
    position: relative;
    zoom: var(--text-scale);
    font-size: 14px;
  }

  svg {
    position: absolute;
    inset: 0;
    overflow: visible;
  }

  svg path {
    fill: none;
    stroke: var(--color-line);
    stroke-width: 1.5;
  }

  svg path.is-highlighted {
    stroke: var(--color-accent);
    stroke-width: 2;
  }

  marker path {
    fill: var(--color-ink-muted);
    stroke: none;
  }

  #arrow-highlighted path {
    fill: var(--color-accent);
  }

  .node {
    position: absolute;
  }

  .node-title {
    padding: 0 0.6em;
    border: 2px solid;
    border-radius: var(--radius);
    background: var(--color-surface);
    color: var(--color-ink);
    font: 600 0.85em / 1.2 var(--font-ui);
    cursor: grab;
    touch-action: none; /* lets touch screens drag instead of scroll */
    user-select: none;
  }

  .node-title:active {
    cursor: grabbing;
  }

  .kind-browser {
    border-color: var(--color-accent);
  }

  .kind-server {
    border-color: var(--color-ink-muted);
    border-style: dashed;
  }

  .kind-step {
    border-color: var(--color-solid);
    background: var(--color-solid);
    color: var(--color-on-solid);
  }

  .note {
    display: none;
    position: absolute;
    top: calc(100% + 6px);
    flex-direction: column;
    gap: 0.3em;
    left: 0;
    z-index: 1;
    width: 18em;
    padding: 0.5em 0.65em;
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    background: var(--color-surface);
    color: var(--color-ink);
    font-weight: 400;
    text-align: left;
    box-shadow: 0 4px 16px rgb(0 0 0 / 0.12);
  }

  /* Covers the gap between node and note, so moving the cursor down doesn't close the note. */
  .note::before {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    height: 8px;
  }

  .note a {
    color: var(--color-link);
    font-size: 0.9em;
  }

  /* Open on hover, or on keyboard focus. A mouse click leaves focus behind but isn't
     focus-visible, so the note still closes when the cursor leaves. */
  .node:hover,
  .node:has(:focus-visible) {
    z-index: 2;
  }

  .node:hover .note,
  .node:has(:focus-visible) .note {
    display: flex;
  }
</style>
