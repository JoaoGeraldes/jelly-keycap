# Working on this project

- Keep code minimal, simple and self-explanatory. Clear names over comments; comments explain _why_.
- Follow the code style in `prettier.config.js` (2 spaces, single quotes, semicolons, 120 columns).
  Format changed files with `npm run format`, or `npx prettier --write <file>`.
- Tests must stay easy to read: test names are plain sentences describing behaviour.
- Whenever a feature is added, removed or changed, run the tests related to it (the table in
  README.md → Tests maps files to test files). Add or update tests for the change. When unsure,
  run `npm test`.
- Never commit; leave changes for the user to review.
