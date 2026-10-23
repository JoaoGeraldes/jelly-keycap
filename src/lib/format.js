/** How values are shown: stored values on the database screen, and the auto-lock countdown. */

/** The schema names every column holding a Unix time in milliseconds *_at (created_at, updated_at). */
export function isTimestampColumn(column) {
  return column.endsWith('_at');
}

/**
 * A Unix time in milliseconds as a readable date and time, in the browser's language and time zone.
 * `locale` and `timeZone` can be given instead, as the tests do.
 */
export function formatTimestamp(milliseconds, { locale, timeZone } = {}) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(milliseconds);
}

/** One table cell: dates made readable, missing values shown as NULL, everything else as stored. */
export function formatCell(column, value, options) {
  if (value === null || value === undefined) return 'NULL';
  return isTimestampColumn(column) ? formatTimestamp(value, options) : value;
}

/** A file size in KB below 1 MB, otherwise in MB with one decimal. */
export function formatSize(bytes) {
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Seconds as a clock-style countdown: 19:05, or 1:30:00 from an hour up. */
export function formatCountdown(seconds) {
  const twoDigits = (value) => String(value).padStart(2, '0');
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = twoDigits(seconds % 60);
  return hours ? `${hours}:${twoDigits(minutes)}:${rest}` : `${minutes}:${rest}`;
}
