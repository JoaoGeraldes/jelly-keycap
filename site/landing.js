// The landing page's jelly keycap: the hero logo, squashed by typing into the
// title, with the same physics as the app (src/lib/jelly-keycap.js).

// Published, the shared file sits next to this page (the workflow copies it,
// see .github/workflows/pages.yml); in a local preview it's read straight from
// the repository, like the font.
const { createJellyKeycap } = await import('./jelly-keycap.js').catch(() =>
  import('../src/lib/jelly-keycap.js'),
);

const KEYS_THAT_DONT_TYPE = ['Shift', 'Control', 'Alt', 'Meta', 'Tab'];

const hero = document.querySelector('.hero');
const canvas = hero.querySelector('.jelly-keycap');
const title = hero.querySelector('.title-input');
// The logo's shapes, from the copy of the logo already in the page.
const shapes = [...document.querySelectorAll('#logo path')].map((path) =>
  path.getAttribute('d'),
);

hero.classList.add('has-jelly'); // first, so the canvas is shown at its size
const keycap = createJellyKeycap(canvas, shapes);

title.addEventListener('keydown', (event) => {
  if (!KEYS_THAT_DONT_TYPE.includes(event.key)) keycap.press();
});
title.addEventListener('input', fitTitleToText);
fitTitleToText();

// Computers only: on a phone, focusing it would open the keyboard over half
// the page before anyone has read a word.
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  title.focus({ preventScroll: true });
  title.setSelectionRange(title.value.length, title.value.length);
}

// The font is monospaced, so the field can be exactly as wide as its text.
function fitTitleToText() {
  title.style.width = `${Math.max(title.value.length, 1) + 1}ch`;
}
