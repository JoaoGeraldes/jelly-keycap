// Textos de src/components/DeleteVaultDialog.svelte.
export default {
  title: (vaultName) => `Eliminar “${vaultName}”?`,
  explanation: (loginCount) =>
    `Isto elimina o cofre e ${loginCount === 1 ? 'a sua entrada' : `as suas ${loginCount} entradas`}. Não pode ser desfeito.`,
  masterPasswordLabel: 'Palavra-passe mestra',
  cancel: 'Cancelar',
  deleteVault: 'Eliminar cofre',
  deleting: 'A eliminar…',
};
