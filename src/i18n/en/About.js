// Texts of src/components/About.svelte.
import { DEFAULT_KDF_PARAMS } from '../../lib/crypto.js';

const { memoryKiB, iterations } = DEFAULT_KDF_PARAMS;

export default {
  title: 'About',
  close: 'Close',
  motto: 'Zero knowledge. One file. Your keys.',
  description:
    'A minimal, [self-hosted](readme) password manager. Your secrets live in one file on your own computer, and are [encrypted in your browser](encryption) before they are ever saved.',
  madeByTitle: 'Made by',
  madeBy: '[João Geraldes](author), with help from everyone who [reports a bug](issues), suggests an idea or [sends a fix](pulls).',
  builtWithAi:
    'Built with the help of AI coding tools ([Claude](claude)). Every change is reviewed and tested before it’s committed.',
  viewSource: 'View the source on GitHub',
  openSourceTitle: 'Free and open source',
  openSource:
    'Jellock is released under the [MIT License](license): use it, study it, change it and share it. Don’t trust, verify: [every line](repository) that touches your secrets is there to read.',
  contribute:
    'Contributions are welcome, big or small: [open an issue](issues) or [send a pull request](pulls). Typos count too.',
  underTheHoodTitle: 'Under the hood',
  underTheHood: 'Small on purpose: the less code there is, the less there is to go wrong. [See for yourself](repository).',
  specs: [
    ['encryption', '[AES-256-GCM](aesGcm), in your browser'],
    ['master key', `[Argon2id](argon2) · ${memoryKiB / 1024} MiB · ${iterations} passes`],
    ['storage', '[SQLite](sqlite), one file you can copy'],
    ['server', '[Node.js](node), zero dependencies'],
    ['interface', '[Svelte](svelte)'],
    ['telemetry', 'none'],
    ['cloud', 'none, unless you put it there'],
  ],
  signOff: 'No telemetry. No accounts. No cloud. Just a SQLite file and some math.',
};
