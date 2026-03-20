/**
 * Calculates the number of remaining sessions from remaining minutes.
 * Returns null when minutesPerSession <= 0 (zero-division guard).
 */
export function getRemainingSessionCount(
  remainingMinutes: number,
  minutesPerSession: number
): number | null {
  if (minutesPerSession <= 0) return null
  return Math.floor(remainingMinutes / minutesPerSession)
}
