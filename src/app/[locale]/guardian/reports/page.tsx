"use client"

import { useEffect, useMemo, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { FileText } from 'lucide-react'
import { ComprehensionBadge } from '@/components/reports/comprehension-badge'
import { MoodIndicator } from '@/components/reports/mood-indicator'
import { SkeletonList } from '@/components/ui/skeleton-card'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorAlert } from '@/components/ui/error-alert'

type ReportRow = {
  id: string
  booking_id: string | null
  published_at: string | null
  content_public: string | null
  subject: string | null
  student_mood: string | null
  comprehension_level: number | null
  profile_id: string | null
}

type ProfileMap = Record<string, string>

export default function GuardianReportsPage() {
  const t = useTranslations('guardianReports')
  const tc = useTranslations('common')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<ReportRow[]>([])
  const [profileNames, setProfileNames] = useState<ProfileMap>({})
  const [filterProfile, setFilterProfile] = useState<string>('all')
  const supabase = useMemo(() => createClient(), [])

  const selectFields = 'id,booking_id,published_at,content_public,subject,student_mood,comprehension_level,profile_id'

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setError(null); setLoading(true)
        const { data: session } = await supabase.auth.getSession()
        const uid = session.session?.user?.id
        if (!uid) { setItems([]); return }

        const { data: students, error: sErr } = await supabase
          .from('students')
          .select('id')
          .eq('guardian_id', uid)
        if (sErr) throw sErr
        const studentIds = (students || []).map(s => s.id)
        if (studentIds.length === 0) { setItems([]); return }

        // Path A: via bookings (legacy)
        let bookingReports: ReportRow[] = []
        const { data: bookings, error: bErr } = await supabase
          .from('bookings')
          .select('id')
          .in('student_id', studentIds)
          .order('start_time', { ascending: false })
          .limit(200)
        if (bErr) throw bErr
        const bookingIds = (bookings || []).map(b => b.id)

        if (bookingIds.length > 0) {
          const { data: reps, error: rErr } = await supabase
            .from('reports')
            .select(selectFields)
            .in('booking_id', bookingIds)
            .eq('visibility', 'public')
            .order('published_at', { ascending: false })
            .limit(100)
          if (rErr) throw rErr
          bookingReports = reps || []
        }

        // Path B: via student_profiles (booking-less reports)
        let profileReports: ReportRow[] = []
        const { data: profiles, error: pErr } = await supabase
          .from('student_profiles')
          .select('id')
          .in('student_id', studentIds)
        if (pErr) throw pErr
        const profileIds = (profiles || []).map(p => p.id)

        if (profileIds.length > 0) {
          const { data: reps, error: rErr } = await supabase
            .from('reports')
            .select(selectFields)
            .in('profile_id', profileIds)
            .eq('visibility', 'public')
            .order('published_at', { ascending: false })
            .limit(100)
          if (rErr) throw rErr
          profileReports = reps || []
        }

        // Merge & deduplicate
        const allReports = [...bookingReports, ...profileReports]
        const seen = new Set<string>()
        const deduplicated = allReports.filter(r => {
          if (seen.has(r.id)) return false
          seen.add(r.id)
          return true
        }).sort((a, b) => {
          const aDate = a.published_at ? new Date(a.published_at).getTime() : 0
          const bDate = b.published_at ? new Date(b.published_at).getTime() : 0
          return bDate - aDate
        })

        if (mounted) setItems(deduplicated)

        // Fetch profile names
        const allProfileIds = deduplicated.map(r => r.profile_id).filter(Boolean) as string[]
        if (allProfileIds.length > 0) {
          const uniqueIds = [...new Set(allProfileIds)]
          const { data: profs } = await supabase
            .from('student_profiles')
            .select('id,name')
            .in('id', uniqueIds)
          if (profs && mounted) {
            const map: ProfileMap = {}
            profs.forEach(p => { map[p.id] = p.name })
            setProfileNames(map)
          }
        }
      } catch (e: unknown) {
        if (mounted) setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [supabase])

  return (
    <ProtectedRoute allowedRoles={["guardian"]}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('title')}</h1>
        {error && <ErrorAlert message={error} />}

        {/* Student filter */}
        {!loading && Object.keys(profileNames).length > 1 && (
          <div className="mb-4 w-full sm:w-64">
            <Select value={filterProfile} onValueChange={setFilterProfile}>
              <SelectTrigger>
                <SelectValue placeholder={t('filterPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filterAll')}</SelectItem>
                {Object.entries(profileNames).map(([id, name]) => (
                  <SelectItem key={id} value={id}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {loading ? (
          <SkeletonList count={3} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t('emptyTitle')}
            description={t('emptyDescription')}
          />
        ) : (() => {
          const filtered = filterProfile === 'all' ? items : items.filter(r => r.profile_id === filterProfile)
          return filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">{t('noFilterResults')}</div>
          ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <Link key={r.id} href={`/guardian/reports/${r.id}`}>
                <Card className="hover:bg-gray-50 dark:hover:bg-brand-900/20 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm">
                          {r.published_at ? format(new Date(r.published_at), 'PPP', { locale: ja }) : tc('unpublished')}
                        </CardTitle>
                        {r.profile_id && profileNames[r.profile_id] && (
                          <Badge variant="outline" className="text-xs">{profileNames[r.profile_id]}</Badge>
                        )}
                        {r.subject && (
                          <span className="text-xs text-gray-500 dark:text-slate-400">{r.subject}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {r.comprehension_level && <ComprehensionBadge level={r.comprehension_level} />}
                        {r.student_mood && <MoodIndicator mood={r.student_mood} />}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-700 dark:text-slate-300 line-clamp-2">
                      {r.content_public ?? tc('noContent')}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          )
        })()}
      </div>
    </ProtectedRoute>
  )
}
