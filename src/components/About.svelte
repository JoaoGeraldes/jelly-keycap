<!-- About the app: what it is, who made it, where the code lives and how to help. -->
<script>
  import { textFor } from "../lib/i18n.svelte.js";
  import logo from "../media/logo-symbol.svg";

  let { onClose } = $props();

  const text = textFor("About");
  const REPOSITORY = "https://github.com/JoaoGeraldes/password-manager-2026";

  // Every address the texts link to, by the name they use for it.
  const LINKS = {
    repository: REPOSITORY,
    readme: `${REPOSITORY}#readme`,
    encryption: `${REPOSITORY}#encryption`,
    issues: `${REPOSITORY}/issues`,
    pulls: `${REPOSITORY}/pulls`,
    license: `${REPOSITORY}/blob/main/LICENSE`,
    author: "https://github.com/JoaoGeraldes",
    aesGcm: "https://csrc.nist.gov/pubs/sp/800/38/d/final",
    argon2: "https://www.rfc-editor.org/rfc/rfc9106",
    sqlite: "https://sqlite.org",
    node: "https://nodejs.org",
    svelte: "https://svelte.dev",
  };

  // Texts mark a link as [words](name), so each language puts its links wherever its own
  // sentence needs them. This splits a text into plain pieces and links.
  function withLinks(content) {
    return content
      .split(/(\[[^\]]+\]\(\w+\))/)
      .filter(Boolean)
      .map((piece) => {
        const link = piece.match(/^\[([^\]]+)\]\((\w+)\)$/);
        return link ? { words: link[1], url: LINKS[link[2]] } : piece;
      });
  }
</script>

{#snippet linked(content)}
  {#each withLinks(content) as piece}{#if typeof piece === "string"}{piece}{:else}<a
        href={piece.url}
        target="_blank"
        rel="noopener noreferrer">{piece.words}</a
      >{/if}{/each}
{/snippet}

<div class="about">
  <header>
    <h1>{text.title}</h1>
    <button class="button-quiet" onclick={onClose}>{text.close}</button>
  </header>

  <section class="card intro">
    <img class="logo" src={logo} alt="" />
    <div class="card-heading">
      <h2>Jellock</h2>
      <p class="motto">{text.motto}</p>
      <p>{@render linked(text.description)}</p>
    </div>
  </section>

  <section class="card">
    <div class="card-heading">
      <h2>{text.madeByTitle}</h2>
      <p>{@render linked(text.madeBy)}</p>
    </div>
    <a class="button source" href={REPOSITORY} target="_blank" rel="noopener noreferrer">{text.viewSource}</a>
  </section>

  <section class="card">
    <div class="card-heading">
      <h2>{text.openSourceTitle}</h2>
      <p>{@render linked(text.openSource)}</p>
      <p>{@render linked(text.contribute)}</p>
    </div>
  </section>

  <section class="card">
    <div class="card-heading">
      <h2>{text.underTheHoodTitle}</h2>
      <p>{@render linked(text.underTheHood)}</p>
    </div>
    <dl class="specs">
      {#each text.specs as [label, value] (label)}
        <dt>{label}</dt>
        <dd>{@render linked(value)}</dd>
      {/each}
    </dl>
  </section>

  <p class="sign-off">{text.signOff}</p>
</div>

<style>
  .about {
    display: grid;
    gap: 1.5rem;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  h1 {
    font-size: 1.5rem;
  }

  .intro {
    grid-template-columns: auto 1fr;
    align-items: center;
  }

  .logo {
    width: 4rem;
  }

  .intro h2 {
    font-size: 1.6rem;
  }

  .motto {
    color: var(--color-accent);
    font-weight: 700;
  }

  .source {
    justify-self: start;
  }

  a:not(.button) {
    color: var(--color-link);
    font-weight: 600;
  }

  /* A small spec sheet: labels on the left, values on the right, like a terminal readout. */
  .specs {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 0.35rem 1.5rem;
    margin: 0;
    padding: 1rem 1.25rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    background: var(--color-background);
    font-family: var(--font-mono);
    font-size: 0.9rem;
  }

  dt {
    color: var(--color-ink-muted);
  }

  dd {
    margin: 0;
  }

  .sign-off {
    color: var(--color-ink-muted);
    text-align: center;
  }
</style>
