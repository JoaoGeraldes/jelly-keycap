// Textos de src/components/About.svelte.
import { DEFAULT_KDF_PARAMS } from '../../lib/crypto.js';

const { memoryKiB, iterations } = DEFAULT_KDF_PARAMS;

export default {
  title: 'Sobre',
  close: 'Fechar',
  motto: 'Macio por fora, encriptado por dentro.',
  description:
    'Um gestor de palavras-passe minimalista e [alojado por si](readme). Os seus segredos vivem num único ficheiro no seu próprio computador, e são [encriptados no navegador](encryption) antes de serem guardados.',
  madeByTitle: 'Feito por',
  madeBy: '[João Geraldes](author), com a ajuda de todos os que [reportam um erro](issues), sugerem uma ideia ou [enviam uma correção](pulls).',
  builtWithAi:
    'Feito com a ajuda de ferramentas de programação com IA ([Claude](claude)). Cada alteração é revista e testada antes de ser guardada no repositório.',
  viewSource: 'Ver o código no GitHub',
  openSourceTitle: 'Livre e de código aberto',
  openSource:
    'O Jellock é distribuído sob a [Licença MIT](license): use-o, estude-o, altere-o e partilhe-o. Não confie, verifique: [cada linha](repository) que toca nos seus segredos está lá para ler.',
  contribute:
    'Contribuições são bem-vindas, grandes ou pequenas: [abra um issue](issues) ou [envie um pull request](pulls). Gralhas também contam.',
  underTheHoodTitle: 'Por dentro',
  underTheHood: 'Pequeno de propósito: quanto menos código, menos coisas podem correr mal. [Veja por si](repository).',
  specs: [
    ['encriptação', '[AES-256-GCM](aesGcm), no seu navegador'],
    ['chave mestra', `[Argon2id](argon2) · ${memoryKiB / 1024} MiB · ${iterations} passagens`],
    ['armazenamento', '[SQLite](sqlite), um ficheiro que pode copiar'],
    ['servidor', '[Node.js](node), zero dependências'],
    ['interface', '[Svelte](svelte)'],
    ['telemetria', 'nenhuma'],
    ['nuvem', 'nenhuma, a menos que a coloque lá'],
  ],
  signOff: 'Feito com cuidado e um pouco de gelatina. Nenhum rastreador foi magoado na criação desta aplicação.',
};
