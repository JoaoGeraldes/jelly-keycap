// Texts of src/components/DatabaseViewer.svelte.
export default {
  title: 'My Database',
  close: 'Close',
  whereTitle: 'Where your vault is stored',
  whereExplanation: (size) => `Your whole vault is this one file (${size}).`,
  backupExplanation:
    'Download a backup to keep a copy somewhere safe, like a USB stick or a cloud folder. It stays encrypted, and copying the file while the app is closed works too.',
  downloadBackup: 'Download backup',
  insideTitle: 'What’s inside',
  insideExplanation:
    'Exactly what is stored in that file. Anything secret is encrypted. Dates are shown in your local time; point at one to see the stored value.',
  tables: 'Tables',
  storedAs: (value) => `Stored as ${value}`,
  emptyTable: 'This table is empty.',
  previous: 'Previous',
  next: 'Next',
  pageOf: (page, pageCount, rowCount) => `Page ${page} of ${pageCount}, ${rowCount} ${rowCount === 1 ? 'row' : 'rows'}`,
};
