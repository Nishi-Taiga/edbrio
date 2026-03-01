/**
 * Checks whether a teacher has completed the required initial setup.
 *
 * Criteria:
 * - At least 1 subject selected
 * - At least 1 grade level selected
 * - display_name is set in public_profile
 * - bio is set in public_profile
 *
 * Stripe integration is NOT required.
 */
export function isInitialSetupComplete(
  subjects: string[],
  grades: string[],
  publicProfile: Record<string, any>
): boolean {
  return getMissingSetupItems(subjects, grades, publicProfile).length === 0
}

/**
 * Returns an array of i18n-friendly keys for missing setup items.
 * Keys correspond to teacherProfile.{key} labels.
 */
export function getMissingSetupItems(
  subjects: string[],
  grades: string[],
  publicProfile: Record<string, any>
): string[] {
  const missing: string[] = []
  if (!Array.isArray(subjects) || subjects.length === 0) missing.push('subjectsLabel')
  if (!Array.isArray(grades) || grades.length === 0) missing.push('gradesLabel')
  if (typeof publicProfile?.display_name !== 'string' || !publicProfile.display_name.trim()) missing.push('displayNameLabel')
  if (typeof publicProfile?.bio !== 'string' || !publicProfile.bio.trim()) missing.push('bioLabel')
  return missing
}
