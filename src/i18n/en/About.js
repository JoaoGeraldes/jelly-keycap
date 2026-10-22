// Texts of src/components/About.svelte.
import { DEFAULT_KDF_PARAMS } from '../../lib/crypto.js';

const { memoryKiB, iterations } = DEFAULT_KDF_PARAMS;

export default {
  title: 'About',
  close: 'Close',
  motto: 'Soft on the outside, encrypted on the inside.',
  description:
    'A minimal, self-hosted password manager. Your secrets live in one file on your own computer, and are encrypted in your browser before they are ever saved.',
  madeByTitle: 'Made by',
  madeBy: 'João Geraldes, with help from everyone who reports a bug, suggests an idea or sends a fix.',
  viewSource: 'View the source on GitHub',
  openSourceTitle: 'Free and open source',
  openSource:
    'Jellock is released under the MIT License: use it, study it, change it and share it. Don’t trust, verify: every line that touches your secrets is there to read.',
  contribute: 'Contributions are welcome, big or small. Typos count too.',
  reportBug: 'Report a bug or suggest an idea',
  pullRequests: 'Send a pull request',
  license: 'Read the licence',
  securityIssue: 'Found a security problem? Please don’t post it publicly.',
  reportPrivately: 'Report it privately',
  underTheHoodTitle: 'Under the hood',
  underTheHood: 'Small on purpose: the less code there is, the less there is to go wrong.',
  specs: [
    ['encryption', 'AES-256-GCM, in your browser'],
    ['master key', `Argon2id · ${memoryKiB / 1024} MiB · ${iterations} passes`],
    ['storage', 'SQLite, one file you can copy'],
    ['server', 'Node.js, zero dependencies'],
    ['interface', 'Svelte'],
    ['telemetry', 'none'],
    ['cloud', 'none, unless you put it there'],
  ],
  signOff: 'Made with care and a little jelly. No trackers were harmed in the making of this app.',
};
