<!-- Text size (A− / A+) and theme controls, shown in the bar at the top right. -->
<script>
  import {
    TEXT_SCALE,
    applyDisplaySettings,
    loadDisplaySettings,
    nextTextScale,
    saveDisplaySettings,
  } from '../lib/display-settings.js';

  let settings = $state(loadDisplaySettings());

  function update(changes) {
    Object.assign(settings, changes);
    applyDisplaySettings(settings);
    saveDisplaySettings(settings);
  }
</script>

<div class="display-settings">
  <button
    class="button-quiet"
    aria-label="Smaller text"
    title="Smaller text"
    disabled={settings.textScale <= TEXT_SCALE.min}
    onclick={() => update({ textScale: nextTextScale(settings.textScale, -1) })}>A−</button
  >
  <button
    class="button-quiet"
    aria-label="Larger text"
    title="Larger text"
    disabled={settings.textScale >= TEXT_SCALE.max}
    onclick={() => update({ textScale: nextTextScale(settings.textScale, 1) })}>A+</button
  >
  <button class="button-quiet theme-toggle" onclick={() => update({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}>
    {settings.theme === 'dark' ? 'Light theme' : 'Dark theme'}
  </button>
</div>

<style>
  .display-settings {
    display: flex;
    gap: 0.15rem;
  }

  button {
    padding: 0.2rem 0.6rem;
  }

  /* A gap and a thin divider keep the theme switch apart from A−/A+, against misclicks. */
  .theme-toggle {
    position: relative;
    margin-left: 1.25rem;
  }

  .theme-toggle::before {
    content: '';
    position: absolute;
    left: -0.65rem;
    top: 20%;
    bottom: 20%;
    border-left: 1px solid var(--color-line);
  }
</style>
