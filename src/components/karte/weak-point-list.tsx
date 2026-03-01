'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2 } from 'lucide-react'
import { StudentWeakPoint } from '@/lib/types/database'
import { useTranslations } from 'next-intl'

interface WeakPointListProps {
  weakPoints: StudentWeakPoint[]
  onAdd: () => void
  onUpdate: (id: string, updates: Partial<StudentWeakPoint>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const severityStyle: Record<string, string> = {
  high: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300',
  low: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300',
}

export function WeakPointList({ weakPoints, onAdd, onUpdate, onDelete }: WeakPointListProps) {
  const t = useTranslations('karte')

  const severityLabel: Record<string, string> = {
    high: t('weakPoints.severityHigh'),
    medium: t('weakPoints.severityMedium'),
    low: t('weakPoints.severityLow'),
  }
  const statusLabel: Record<string, string> = {
    active: t('weakPoints.statusActive'),
    improving: t('weakPoints.statusImproving'),
    resolved: t('weakPoints.statusResolved'),
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('weakPoints.title')}</CardTitle>
          <Button size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" />{t('weakPoints.add')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {weakPoints.length === 0 ? (
          <p className="text-gray-500 text-sm">{t('weakPoints.empty')}</p>
        ) : (
          <div className="space-y-2">
            {weakPoints.map(wp => (
              <div key={wp.id} className={`border rounded-lg p-3 ${severityStyle[wp.severity] || ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-sm">{wp.subject} - {wp.topic}</div>
                    {wp.notes && <p className="text-xs mt-1 opacity-80">{wp.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">{severityLabel[wp.severity] || wp.severity}</Badge>
                    <Badge variant="outline" className="text-xs">{statusLabel[wp.status] || wp.status}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 justify-end mt-2">
                  {wp.status === 'active' && (
                    <Button variant="ghost" size="sm" onClick={() => onUpdate(wp.id, { status: 'improving' })}>{t('weakPoints.toImproving')}</Button>
                  )}
                  {wp.status === 'improving' && (
                    <Button variant="ghost" size="sm" onClick={() => onUpdate(wp.id, { status: 'resolved', resolved_at: new Date().toISOString().split('T')[0] })}>{t('weakPoints.toResolved')}</Button>
                  )}
                  {wp.status === 'resolved' && (
                    <Button variant="ghost" size="sm" onClick={() => onUpdate(wp.id, { status: 'active', resolved_at: undefined })}>{t('weakPoints.reoccurred')}</Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => onDelete(wp.id)}>
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
