/**
 * Checks whether a teacher has completed the required initial setup.
 *
 * Criteria:
 * - At least 1 subject selected
 * - At least 1 grade level selected
 * - display_name is set in public_profile
 *
 * Stripe integration is NOT required.
 */
export function isInitialSetupComplete(
  subjects: string[],
  grades: string[],
  publicProfile: Record<string, any>
): boolean {
  const hasSubjects = Array.isArray(subjects) && subjects.length > 0
  const hasGrades = Array.isArray(grades) && grades.length > 0
  const hasDisplayName =
    typeof publicProfile?.display_name === 'string' &&
    publicProfile.display_name.trim().length > 0
  return hasSubjects && hasGrades && hasDisplayName
}
