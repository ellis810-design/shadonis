/**
 * Date helpers that avoid the UTC-midnight trap.
 *
 * `new Date("1995-08-10")` is parsed as 1995-08-10T00:00:00Z (UTC). When the
 * runtime then formats or extracts components in local time (e.g. via
 * `getDate()` or `toLocaleDateString()`), users west of UTC see the previous
 * day. We always want the wall-clock date the user typed, so we parse the
 * components manually and construct in local time.
 */

/** Parse "YYYY-MM-DD" → Date at local midnight on that date. */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map((n) => parseInt(n, 10));
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

/**
 * Parse "YYYY-MM-DD" + optional "HH:MM:SS" into a single local-time Date.
 * Used as the input to the astrology services, which then read year /
 * month / day / hour / minute via local-time getters.
 */
export function parseLocalDateTime(
  dateStr: string,
  timeStr: string | null
): Date {
  const [y, m, d] = dateStr.split("-").map((n) => parseInt(n, 10));
  const [hh = 12, mm = 0] = (timeStr ?? "12:00:00")
    .split(":")
    .map((n) => parseInt(n, 10));
  return new Date(y, (m || 1) - 1, d || 1, hh, mm, 0, 0);
}
