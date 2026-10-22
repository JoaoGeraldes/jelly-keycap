// Texts of src/components/DeleteVaultDialog.svelte.
export default {
  title: (vaultName) => `Delete “${vaultName}”?`,
  explanation: (loginCount) =>
    `This deletes the vault and its ${loginCount} ${loginCount === 1 ? 'login' : 'logins'}. It can’t be undone.`,
  masterPasswordLabel: 'Master password',
  cancel: 'Cancel',
  deleteVault: 'Delete vault',
  deleting: 'Deleting…',
};
