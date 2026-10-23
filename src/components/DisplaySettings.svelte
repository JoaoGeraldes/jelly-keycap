<!-- Text size (A− / A+) and theme controls, shown in the bar at the top right. -->
<script>
  import { textFor } from "../lib/i18n.svelte.js";
  import {
    TEXT_SCALE,
    displaySettings as settings,
    nextTextScale,
    updateDisplaySettings as update,
  } from "../lib/display-settings.svelte.js";

  const text = textFor("DisplaySettings");
</script>

<div class="display-settings">
  <button
    class="button-quiet"
    aria-label={text.smallerText}
    title={text.smallerText}
    disabled={settings.textScale <= TEXT_SCALE.min}
    onclick={() => update({ textScale: nextTextScale(settings.textScale, -1) })}
    >A−</button
  >
  <button
    class="button-quiet"
    aria-label={text.largerText}
    title={text.largerText}
    disabled={settings.textScale >= TEXT_SCALE.max}
    onclick={() => update({ textScale: nextTextScale(settings.textScale, 1) })}
    >A+</button
  >
  <button
    class="button-quiet theme-toggle"
    onclick={() =>
      update({ theme: settings.theme === "dark" ? "light" : "dark" })}
  >
    {settings.theme === "dark" ? text.lightTheme : text.darkTheme}
  </button>
</div>

<style>
  /* Everything here is in px so it keeps its size when the text size changes
     (see .top-bar in App.svelte). Buttons are at least 32px, well above the 24px minimum target. */
  .display-settings {
    display: flex;
    gap: 4px;
  }

  button {
    min-width: 32px;
    min-height: 32px;
    padding: 0 10px;
    font-size: 14px;
  }

  /* A gap and a thin divider keep the theme switch apart from A−/A+, against misclicks. */
  .theme-toggle {
    position: relative;
    margin-left: 20px;
    min-width: 104px; /* "Light theme" and "Dark theme" differ in width; this keeps A−/A+ still */
  }

  .theme-toggle::before {
    content: "";
    position: absolute;
    left: -12px;
    top: 20%;
    bottom: 20%;
    border-left: 1px solid var(--color-line);
  }
</style>
