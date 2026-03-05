"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { Calendar } from 'lucide-react'
import { Booking } from '@/lib/types/database'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface UpcomingLessonsProps {
  upcomingLessons: Booking[]
  studentNames: Record<string, string>
  loading: boolean
}

export function UpcomingLessons({ upcomingLessons, studentNames, loading }: UpcomingLessonsProps) {
  const t = useTranslations('teacherDashboard')
  const tc = useTranslations('common')

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-28" />
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-muted rounded" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{t('upcomingLessonsTitle')}</CardTitle>
          <Link href="/teacher/calendar">
            <Button variant="ghost" size="sm" className="text-xs h-7">
              {t('upcomingLessonsViewAll')}
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {upcomingLessons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Calendar className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">{t('upcomingLessonsEmpty')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingLessons.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {studentNames[b.student_id] || tc('student')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(b.start_time), 'M/d（E） HH:mm', { locale: ja })}
                    {' – '}
                    {format(new Date(b.end_time), 'HH:mm')}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-xs shrink-0 ml-2 ${
                    b.status === 'confirmed'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                  }`}
                >
                  {b.status === 'confirmed' ? t('statusConfirmed') : t('statusPending')}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
