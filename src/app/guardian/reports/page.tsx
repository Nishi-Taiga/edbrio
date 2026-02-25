"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ComprehensionBadge } from '@/components/reports/comprehension-badge'
import { MoodIndicator } from '@/components/reports/mood-indicator'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<ReportRow[]>([])
  const [profileNames, setProfileNames] = useState<ProfileMap>({})
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">レポート</h1>
        {error && (
          <div className="mb-4 p-3 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded text-red-700 dark:text-red-400">{error}</div>
        )}
        {loading ? (
          <div className="text-gray-500 dark:text-slate-400">読み込み中...</div>
        ) : items.length === 0 ? (
          <div className="text-gray-500 dark:text-slate-400">レポートはありません。</div>
        ) : (
          <div className="space-y-3">
            {items.map((r) => (
              <Link key={r.id} href={`/guardian/reports/${r.id}`}>
                <Card className="hover:bg-gray-50 dark:hover:bg-brand-900/20 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm">
                          {r.published_at ? format(new Date(r.published_at), 'PPP', { locale: ja }) : '未公開'}
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
                      {r.content_public ?? '（内容なし）'}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
