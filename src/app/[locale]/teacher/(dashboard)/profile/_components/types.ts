import type { AreaSelection } from '@/lib/types/database'

export type PublicProfile = {
  display_name?: string
  bio?: string
  area?: string
  service_areas?: AreaSelection[]
  available_online?: boolean
  experience_years?: string
}

export type TeacherRow = {
  id: string
  subjects: string[]
  grades: string[]
  plan: 'free' | 'standard'
  public_profile: PublicProfile
  stripe_account_id?: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  is_onboarding_complete?: boolean
}

/** Convert legacy StationSelection data to AreaSelection format */
export function migrateServiceAreas(raw: unknown[]): AreaSelection[] {
  if (!Array.isArray(raw)) return []
  return raw.map(item => {
    const obj = item as Record<string, string>
    if ('line' in obj && 'name' in obj) {
      return { prefecture: obj.prefecture, municipality: obj.name }
    }
    return item as AreaSelection
  })
}
