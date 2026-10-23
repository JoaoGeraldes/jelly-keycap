// One code style for every file, whoever or whatever edits it. Editors
// with Prettier apply it on save (see .vscode/settings.json). Older files
// are brought in line when they're next changed, rather than all at once,
// so diffs show real changes and not formatting.
export default {
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  // HTML attributes in .svelte files stay in double quotes, as HTML expects.
  singleQuote: true,
  trailingComma: 'all',
  bracketSpacing: true,
  arrowParens: 'always',
  // The same on Windows, macOS and Linux, so line endings never show in a diff.
  endOfLine: 'lf',
  // Markdown keeps its line breaks as written.
  proseWrap: 'preserve',
  plugins: ['prettier-plugin-svelte'],
  overrides: [{ files: '*.svelte', options: { parser: 'svelte' } }],
};
