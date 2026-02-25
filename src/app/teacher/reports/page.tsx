"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ComprehensionBadge } from '@/components/reports/comprehension-badge'
import { MoodIndicator } from '@/components/reports/mood-indicator'

type ReportRow = {
  id: string
  booking_id: string
  published_at: string | null
  content_raw: string | null
  content_public: string | null
  subject: string | null
  student_mood: string | null
  comprehension_level: number | null
  visibility: string | null
  profile_id: string | null
}

type ProfileMap = Record<string, string>

export default function TeacherReportsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<ReportRow[]>([])
  const [profileNames, setProfileNames] = useState<ProfileMap>({})
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setError(null); setLoading(true)
        const { data: session } = await supabase.auth.getSession()
        const uid = session.session?.user?.id
        if (!uid) { setItems([]); return }

        // Fetch reports that have teacher_id (new reports) or via bookings (legacy)
        const { data: directReports, error: drErr } = await supabase
          .from('reports')
          .select('id,booking_id,published_at,content_raw,content_public,subject,student_mood,comprehension_level,visibility,profile_id')
          .eq('teacher_id', uid)
          .order('created_at', { ascending: false })
          .limit(100)

        // Also fetch legacy reports via bookings
        const { data: bookings, error: bErr } = await supabase
          .from('bookings')
          .select('id')
          .eq('teacher_id', uid)
          .order('start_time', { ascending: false })
          .limit(200)
        if (bErr) throw bErr

        const bIds = (bookings || []).map(b => b.id)
        let legacyReports: ReportRow[] = []
        if (bIds.length > 0) {
          const { data: reps, error: rErr } = await supabase
            .from('reports')
            .select('id,booking_id,published_at,content_raw,content_public,subject,student_mood,comprehension_level,visibility,profile_id')
            .in('booking_id', bIds)
            .order('created_at', { ascending: false })
            .limit(100)
          if (rErr) throw rErr
          legacyReports = reps || []
        }

        // Merge and deduplicate
        const allReports = [...(directReports || []), ...legacyReports]
        const seen = new Set<string>()
        const deduplicated = allReports.filter(r => {
          if (seen.has(r.id)) return false
          seen.add(r.id)
          return true
        })

        if (mounted) setItems(deduplicated)

        // Fetch profile names
        const profileIds = deduplicated.map(r => r.profile_id).filter(Boolean) as string[]
        if (profileIds.length > 0) {
          const uniqueIds = [...new Set(profileIds)]
          const { data: profiles } = await supabase
            .from('student_profiles')
            .select('id,name')
            .in('id', uniqueIds)
          if (profiles && mounted) {
            const map: ProfileMap = {}
            profiles.forEach(p => { map[p.id] = p.name })
            setProfileNames(map)
          }
        }
      } catch (e: unknown) {
        if (mounted) setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load(); return () => { mounted = false }
  }, [supabase])

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">レポート</h1>
          <Link href="/teacher/reports/new">
            <Button><Plus className="w-4 h-4 mr-1" />新規レポート作成</Button>
          </Link>
        </div>
        {error && (<div className="mb-4 p-3 text-sm bg-red-50 border border-red-200 rounded text-red-700 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400">{error}</div>)}
        {loading ? (
          <div className="text-gray-500 dark:text-slate-400">読み込み中...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-slate-400 mb-4">レポートはありません。</p>
            <Link href="/teacher/reports/new">
              <Button><Plus className="w-4 h-4 mr-1" />最初のレポートを作成</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((r) => (
              <Link key={r.id} href={`/teacher/reports/${r.id}`}>
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
                        <Badge variant={r.visibility === 'public' ? 'default' : 'secondary'}>
                          {r.visibility === 'public' ? '公開' : '下書き'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {r.content_public ?? r.content_raw ?? '（内容なし）'}
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
