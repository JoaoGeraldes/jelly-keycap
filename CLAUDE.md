# Working on this project

- Keep code minimal, simple and self-explanatory. Clear names over comments; comments explain _why_.
- Follow the code style in `prettier.config.js` (2 spaces, single quotes, semicolons, 80 columns).
  Format only the files you change (`npx prettier --write <file>`); older files are brought in
  line when they're next touched, never all at once.
- Tests must stay easy to read: test names are plain sentences describing behaviour.
- Whenever a feature is added, removed or changed, run the tests related to it (the table in
  README.md → Tests maps files to test files). Add or update tests for the change. When unsure,
  run `npm test`.
- Security-sensitive changes (the API and server in `server/`, `src/lib/crypto.js`,
  `src/lib/vault.svelte.js`, key derivation, encryption, security headers, backup and restore)
  must be checked against current guidance from reputable sources: the OWASP Cheat Sheet Series
  and ASVS, NIST (SP 800-63B, SP 800-38D), the relevant RFCs (e.g. RFC 9106 for Argon2) and MDN's
  web security docs. Name the sources checked when describing the change, and never weaken a
  security default (Argon2 parameters, CSP, Host check, JSON-only writes) without the user's
  explicit approval.
- Never commit; leave changes for the user to review.
