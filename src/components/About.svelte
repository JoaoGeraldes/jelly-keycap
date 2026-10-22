<!-- About the app: what it is, who made it, where the code lives and how to help. -->
<script>
  import { textFor } from "../lib/i18n.svelte.js";
  import logo from "../media/logo-symbol.svg";

  let { onClose } = $props();

  const text = textFor("About");
  const REPOSITORY = "https://github.com/JoaoGeraldes/password-manager-2026";
</script>

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
      <p>{text.description}</p>
    </div>
  </section>

  <section class="card">
    <div class="card-heading">
      <h2>{text.madeByTitle}</h2>
      <p>{text.madeBy}</p>
    </div>
    <a class="button source" href={REPOSITORY} target="_blank" rel="noopener noreferrer">{text.viewSource}</a>
  </section>

  <section class="card">
    <div class="card-heading">
      <h2>{text.openSourceTitle}</h2>
      <p>{text.openSource}</p>
      <p>{text.contribute}</p>
    </div>
    <nav class="links" aria-label={text.openSourceTitle}>
      <a href="{REPOSITORY}/issues" target="_blank" rel="noopener noreferrer">{text.reportBug}</a>
      <a href="{REPOSITORY}/pulls" target="_blank" rel="noopener noreferrer">{text.pullRequests}</a>
      <a href="{REPOSITORY}/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">{text.license}</a>
    </nav>
    <!-- Security problems shouldn't be posted where anyone can read them before they're fixed. -->
    <p class="security">
      {text.securityIssue}
      <a href="{REPOSITORY}/security/advisories/new" target="_blank" rel="noopener noreferrer">{text.reportPrivately}</a>
    </p>
  </section>

  <section class="card">
    <div class="card-heading">
      <h2>{text.underTheHoodTitle}</h2>
      <p>{text.underTheHood}</p>
    </div>
    <dl class="specs">
      {#each text.specs as [label, value] (label)}
        <dt>{label}</dt>
        <dd>{value}</dd>
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

  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.25rem;
  }

  a:not(.button) {
    color: var(--color-link);
    font-weight: 600;
  }

  .security {
    color: var(--color-ink-muted);
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
