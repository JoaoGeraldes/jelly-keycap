// Textos de src/components/About.svelte.
import { DEFAULT_KDF_PARAMS } from '../../lib/crypto.js';

const { memoryKiB, iterations } = DEFAULT_KDF_PARAMS;

export default {
  title: 'Sobre',
  close: 'Fechar',
  motto: 'Macio por fora, encriptado por dentro.',
  description:
    'Um gestor de palavras-passe minimalista e alojado por si. Os seus segredos vivem num único ficheiro no seu próprio computador, e são encriptados no navegador antes de serem guardados.',
  madeByTitle: 'Feito por',
  madeBy: 'João Geraldes, com a ajuda de todos os que reportam um erro, sugerem uma ideia ou enviam uma correção.',
  viewSource: 'Ver o código no GitHub',
  openSourceTitle: 'Livre e de código aberto',
  openSource:
    'O Jellock é distribuído sob a Licença MIT: use-o, estude-o, altere-o e partilhe-o. Não confie, verifique: cada linha que toca nos seus segredos está lá para ler.',
  contribute: 'Contribuições são bem-vindas, grandes ou pequenas. Gralhas também contam.',
  reportBug: 'Reportar um erro ou sugerir uma ideia',
  pullRequests: 'Enviar um pull request',
  license: 'Ler a licença',
  securityIssue: 'Encontrou um problema de segurança? Por favor, não o publique.',
  reportPrivately: 'Reporte-o em privado',
  underTheHoodTitle: 'Por dentro',
  underTheHood: 'Pequeno de propósito: quanto menos código, menos coisas podem correr mal.',
  specs: [
    ['encriptação', 'AES-256-GCM, no seu navegador'],
    ['chave mestra', `Argon2id · ${memoryKiB / 1024} MiB · ${iterations} passagens`],
    ['armazenamento', 'SQLite, um ficheiro que pode copiar'],
    ['servidor', 'Node.js, zero dependências'],
    ['interface', 'Svelte'],
    ['telemetria', 'nenhuma'],
    ['nuvem', 'nenhuma, a menos que a coloque lá'],
  ],
  signOff: 'Feito com cuidado e um pouco de gelatina. Nenhum rastreador foi magoado na criação desta aplicação.',
};
