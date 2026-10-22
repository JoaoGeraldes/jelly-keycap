// Textos de src/components/RestoreBackup.svelte.
export default {
  title: 'Restaurar uma cópia de segurança',
  explanation:
    'Volte a pôr o seu cofre como estava numa cópia de segurança. O cofre atual é guardado primeiro como cópia, por isso nada se perde, e pode voltar atrás a qualquer momento restaurando essa cópia da mesma forma.',
  howItWorks:
    'Restaurar copia o conteúdo da cópia de segurança para o ficheiro habitual do seu cofre, por isso a aplicação continua a usar o mesmo ficheiro e o mesmo local. O ficheiro que escolher é apenas lido, nunca alterado.',
  backupFileLabel: 'Ficheiro de cópia de segurança',
  passwordLabel: 'A sua palavra-passe mestra atual, para confirmar que é você',
  restore: 'Restaurar esta cópia',
  restoring: 'A restaurar…',
};
