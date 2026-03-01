'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Star } from 'lucide-react'
import { StudentStrength } from '@/lib/types/database'
import { useTranslations } from 'next-intl'

interface StrengthListProps {
  strengths: StudentStrength[]
  onAdd: () => void
  onDelete: (id: string) => Promise<void>
}

export function StrengthList({ strengths, onAdd, onDelete }: StrengthListProps) {
  const t = useTranslations('karte')
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('strengths.title')}</CardTitle>
          <Button size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" />{t('strengths.add')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {strengths.length === 0 ? (
          <p className="text-gray-500 text-sm">{t('strengths.empty')}</p>
        ) : (
          <div className="space-y-2">
            {strengths.map(s => (
              <div key={s.id} className="border rounded-lg p-3 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm text-green-800 dark:text-green-200">{s.subject} - {s.topic}</div>
                      {s.notes && <p className="text-xs mt-1 text-green-700 dark:text-green-300">{s.notes}</p>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => onDelete(s.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
