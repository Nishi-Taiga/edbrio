'use client'

import { Link } from '@/i18n/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GraduationCap, BookOpen } from 'lucide-react'
import { StudentProfile } from '@/lib/types/database'
import { useTranslations } from 'next-intl'

interface StudentCardProps {
  profile: StudentProfile
}

export function StudentCard({ profile }: StudentCardProps) {
  const t = useTranslations('karte')
  return (
    <Link href={`/teacher/students/${profile.id}`}>
      <Card className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{profile.name}</CardTitle>
            <Badge variant={profile.status === 'active' ? 'default' : 'secondary'}>
              {profile.status === 'active' ? t('card.statusActive') : t('card.statusInactive')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            {profile.grade && (
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" />
                <span>{profile.grade}</span>
              </div>
            )}
            {profile.subjects && profile.subjects.length > 0 && (
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                <div className="flex flex-wrap gap-1">
                  {profile.subjects.map((s) => (
                    <span key={s} className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 text-xs rounded px-1.5 py-0.5">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {profile.school && (
              <div className="text-xs text-gray-500">{profile.school}</div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
