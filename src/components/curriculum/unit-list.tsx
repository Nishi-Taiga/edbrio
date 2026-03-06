'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Play, CheckCircle } from 'lucide-react'
import { CurriculumUnit } from '@/lib/types/database'
import { useTranslations } from 'next-intl'

interface UnitListProps {
  units: CurriculumUnit[]
  onAdd: () => void
  onUpdate: (id: string, updates: Partial<CurriculumUnit>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  not_started: 'outline',
  in_progress: 'default',
  completed: 'secondary',
}

export function UnitList({ units, onAdd, onUpdate, onDelete }: UnitListProps) {
  const t = useTranslations('curriculum.units')

  const statusLabel: Record<string, string> = {
    not_started: t('statusNotStarted'),
    in_progress: t('statusInProgress'),
    completed: t('statusCompleted'),
  }

  // Group units by subject
  const grouped = units.reduce<Record<string, CurriculumUnit[]>>((acc, unit) => {
    if (!acc[unit.subject]) acc[unit.subject] = []
    acc[unit.subject].push(unit)
    return acc
  }, {})

  const subjects = Object.keys(grouped)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('title')}</CardTitle>
          <Button size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" />{t('add')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {units.length === 0 ? (
          <p className="text-gray-500 text-sm">{t('empty')}</p>
        ) : (
          <div className="space-y-6">
            {subjects.map(subject => (
              <div key={subject}>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{subject}</h4>
                <div className="space-y-2">
                  {grouped[subject].map(unit => (
                    <div key={unit.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-sm">{unit.unit_name}</div>
                          {unit.description && <p className="text-xs text-gray-500 mt-1">{unit.description}</p>}
                        </div>
                        <Badge variant={statusVariant[unit.status] || 'outline'}>
                          {statusLabel[unit.status] || unit.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 justify-end mt-2">
                        {unit.status === 'not_started' && (
                          <Button variant="ghost" size="sm" onClick={() => onUpdate(unit.id, { status: 'in_progress', started_at: new Date().toISOString().split('T')[0] })}>
                            <Play className="w-4 h-4 mr-1" />{t('start')}
                          </Button>
                        )}
                        {unit.status === 'in_progress' && (
                          <Button variant="ghost" size="sm" onClick={() => onUpdate(unit.id, { status: 'completed', completed_at: new Date().toISOString().split('T')[0] })}>
                            <CheckCircle className="w-4 h-4 mr-1" />{t('complete')}
                          </Button>
                        )}
                        {unit.status === 'completed' && (
                          <Button variant="ghost" size="sm" onClick={() => onUpdate(unit.id, { status: 'in_progress', completed_at: undefined })}>
                            {t('reopen')}
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => onDelete(unit.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
