/**
 * Week-index utilities for curriculum phases.
 *
 * Phases store their schedule as week indices relative to an academic year
 * (April → next March). All Date <-> week conversions go through this module
 * so the math stays consistent regardless of the runtime timezone.
 *
 * Week index is 1-based:
 *   weekIndex = 1   → first Monday of April of the academic year
 *   weekIndex = 2   → next Monday, etc.
 */

const MS_PER_DAY = 86_400_000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

/** First Monday on or after April 1 of `year` (local time). */
export function academicYearStart(year: number): Date {
  const apr1 = new Date(year, 3, 1);
  const dow = apr1.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const offset = dow === 0 ? 1 : dow === 1 ? 0 : 8 - dow;
  const monday = new Date(apr1);
  monday.setDate(apr1.getDate() + offset);
  return monday;
}

/** Total number of weeks in the academic year (first Monday of April → March 31). */
export function academicYearWeekCount(year: number): number {
  const start = academicYearStart(year);
  const end = new Date(year + 1, 2, 31); // March 31
  return Math.floor((end.getTime() - start.getTime()) / MS_PER_WEEK) + 1;
}

/** Monday Date for the given week index in the academic year. */
export function weekIndexToMonday(year: number, weekIndex: number): Date {
  const start = academicYearStart(year);
  const d = new Date(start);
  d.setDate(start.getDate() + (weekIndex - 1) * 7);
  return d;
}

/** Sunday Date (end of that week) for the given week index. */
export function weekIndexToSunday(year: number, weekIndex: number): Date {
  const monday = weekIndexToMonday(year, weekIndex);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday;
}

/** Convert any Date to its 1-based week index within the academic year. */
export function dateToWeekIndex(year: number, date: Date): number {
  const start = academicYearStart(year);
  const days = Math.floor((date.getTime() - start.getTime()) / MS_PER_DAY);
  return Math.max(1, Math.floor(days / 7) + 1);
}

/** Render a week index as "M月 第N週" (month-relative numbering). */
export function weekIndexToLabel(year: number, weekIndex: number): string {
  const monday = weekIndexToMonday(year, weekIndex);
  const month = monday.getMonth() + 1;
  // Sunday that starts the Sun-Sat week containing this Monday (Monday = dow 1, so go back 1 day)
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() - 1);
  // Sunday of the Sun-Sat week containing day 1 of this month
  const firstOfMonth = new Date(monday.getFullYear(), monday.getMonth(), 1);
  const firstSunday = new Date(firstOfMonth);
  firstSunday.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());
  const weekInMonth = Math.min(
    4,
    Math.floor((sunday.getTime() - firstSunday.getTime()) / MS_PER_WEEK) + 1,
  );
  return `${month}月 第${weekInMonth}週`;
}

/** All selectable weeks of the academic year as `{ value, label }` pairs. Weeks beyond the 4th of any month are excluded. */
export function generateWeekOptions(
  year: number,
): { value: number; label: string }[] {
  const total = academicYearWeekCount(year);
  const seen = new Set<string>();
  const options: { value: number; label: string }[] = [];
  for (let i = 1; i <= total; i++) {
    const label = weekIndexToLabel(year, i);
    if (!seen.has(label)) {
      seen.add(label);
      options.push({ value: i, label });
    }
  }
  return options;
}

/** Format a Date as a local YYYY-MM-DD string (timezone-safe). */
export function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** YYYY-MM-DD date string for the Monday of a given week index. */
export function weekIndexToStartDate(year: number, weekIndex: number): string {
  return formatLocalDate(weekIndexToMonday(year, weekIndex));
}

/** YYYY-MM-DD date string for the Sunday of a given week index. */
export function weekIndexToEndDate(year: number, weekIndex: number): string {
  return formatLocalDate(weekIndexToSunday(year, weekIndex));
}
