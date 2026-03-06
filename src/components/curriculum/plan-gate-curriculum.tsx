'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Users } from 'lucide-react'

export function PlanGateCurriculum() {
  const t = useTranslations('teacherStudents')

  return (
    <div className="flex items-center justify-center h-full p-6">
      <Card className="max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
            <Users className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('planGate.title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('planGate.description')}
          </p>
          <Link href="/teacher/profile">
            <Button className="mt-2">{t('planGate.upgrade')}</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
