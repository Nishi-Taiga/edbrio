"use client"

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SkeletonList } from '@/components/ui/skeleton-card'
import { ErrorAlert } from '@/components/ui/error-alert'
import { createClient } from '@/lib/supabase/client'
import { Report } from '@/lib/types/database'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ComprehensionBadge } from '@/components/reports/comprehension-badge'
import { MoodIndicator } from '@/components/reports/mood-indicator'

export default function GuardianReportDetailPage() {
  const t = useTranslations('guardianReportDetail')
  const params = useParams()
  const reportId = params.reportId as string
  const supabase = useMemo(() => createClient(), [])

  const [report, setReport] = useState<Report | null>(null)
  const [profileName, setProfileName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!reportId) return
    let mounted = true
    async function load() {
      try {
        const { data, error: err } = await supabase
          .from('reports')
          .select('*')
          .eq('id', reportId)
          .single()
        if (err) throw err
        if (!mounted) return
        setReport(data)

        if (data.profile_id) {
          const { data: profile } = await supabase
            .from('student_profiles')
            .select('name')
            .eq('id', data.profile_id)
            .single()
          if (profile && mounted) setProfileName(profile.name)
        }
      } catch (e: unknown) {
        if (mounted) setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [reportId, supabase])

  return (
    <ProtectedRoute allowedRoles={["guardian"]}>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-4">
          <Link href="/guardian/reports" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">{t('breadcrumbReports')}</Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">{t('breadcrumbDetail')}</span>
        </nav>

        {loading ? (
          <SkeletonList count={3} />
        ) : !report ? (
          <ErrorAlert message={t('notFound')} />
        ) : (<>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          {profileName && <p className="text-gray-600 dark:text-slate-400 text-sm">{profileName}</p>}
        </div>

        {error && <ErrorAlert message={error} />}

        <div className="space-y-4">
          {/* Report Info */}
          <Card>
            <CardHeader><CardTitle className="text-base">{t('reportInfo')}</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {report.published_at && (
                  <div>
                    <dt className="text-gray-500 dark:text-slate-400">{t('publishDate')}</dt>
                    <dd>{format(new Date(report.published_at), 'PPP', { locale: ja })}</dd>
                  </div>
                )}
                {report.subject && (
                  <div>
                    <dt className="text-gray-500 dark:text-slate-400">{t('subject')}</dt>
                    <dd>{report.subject}</dd>
                  </div>
                )}
                {report.comprehension_level && (
                  <div>
                    <dt className="text-gray-500 dark:text-slate-400">{t('comprehension')}</dt>
                    <dd><ComprehensionBadge level={report.comprehension_level} /></dd>
                  </div>
                )}
                {report.student_mood && (
                  <div>
                    <dt className="text-gray-500 dark:text-slate-400">{t('mood')}</dt>
                    <dd><MoodIndicator mood={report.student_mood} /></dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Report Content */}
          {report.content_public && (
            <Card>
              <CardHeader><CardTitle className="text-base">{t('reportContent')}</CardTitle></CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm">{report.content_public}</div>
              </CardContent>
            </Card>
          )}

          {/* Homework */}
          {report.homework && (
            <Card>
              <CardHeader><CardTitle className="text-base">{t('homework')}</CardTitle></CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm">{report.homework}</div>
              </CardContent>
            </Card>
          )}

          {/* Next Plan */}
          {report.next_plan && (
            <Card>
              <CardHeader><CardTitle className="text-base">{t('nextPlan')}</CardTitle></CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm">{report.next_plan}</div>
              </CardContent>
            </Card>
          )}
        </div>
        </>)}
      </div>
    </ProtectedRoute>
  )
}
