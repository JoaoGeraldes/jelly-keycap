// One code style for every file, whoever or whatever edits it: `npm run format` applies it to the
// whole project, and editors with Prettier apply it on save (see .vscode/settings.json).
// The values follow how the code was already written, so formatting changes as little as possible.
export default {
  printWidth: 120, // most lines were written up to about this long; 80 would wrap a lot of them
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true, // HTML attributes in .svelte files stay in double quotes, as HTML expects
  trailingComma: 'all',
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf', // the same on Windows, macOS and Linux, so line endings never show up in a diff
  proseWrap: 'preserve', // Markdown keeps its line breaks as written
  plugins: ['prettier-plugin-svelte'],
  overrides: [{ files: '*.svelte', options: { parser: 'svelte' } }],
};
