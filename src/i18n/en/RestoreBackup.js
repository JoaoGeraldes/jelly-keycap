// Texts of src/components/RestoreBackup.svelte.
export default {
  title: 'Restore a backup',
  explanation:
    'Bring your vault back to how it was in a backup file. Your current vault is saved as a copy first, so nothing is lost, and you can switch back any time by restoring that copy the same way.',
  howItWorks:
    'Restoring copies what’s inside the backup into your usual vault file, so the app keeps using the same file and location as before. The backup file you pick is only read, never changed.',
  backupFileLabel: 'Backup file',
  passwordLabel: 'Your current master password, to confirm it’s you',
  restore: 'Restore this backup',
  restoring: 'Restoring…',
};
