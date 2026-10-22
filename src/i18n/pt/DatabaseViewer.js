// Textos de src/components/DatabaseViewer.svelte.
export default {
  title: 'A minha base de dados',
  close: 'Fechar',
  whereTitle: 'Onde o seu cofre está guardado',
  whereExplanation: (size) => `Todo o seu cofre é este único ficheiro (${size}).`,
  backupExplanation:
    'Transfira uma cópia de segurança para a guardar num local seguro, como uma pen USB ou uma pasta na nuvem. Continua encriptada, e copiar o ficheiro com a aplicação fechada também funciona.',
  downloadBackup: 'Transferir cópia de segurança',
  insideTitle: 'O que tem lá dentro',
  insideExplanation:
    'Exatamente o que está guardado nesse ficheiro. Tudo o que é secreto está encriptado. As datas aparecem na sua hora local; aponte para uma para ver o valor guardado.',
  tables: 'Tabelas',
  storedAs: (value) => `Guardado como ${value}`,
  emptyTable: 'Esta tabela está vazia.',
  previous: 'Anterior',
  next: 'Seguinte',
  pageOf: (page, pageCount, rowCount) =>
    `Página ${page} de ${pageCount}, ${rowCount} ${rowCount === 1 ? 'linha' : 'linhas'}`,
};
