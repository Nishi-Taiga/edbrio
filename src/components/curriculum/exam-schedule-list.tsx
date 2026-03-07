'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Pencil, Calendar } from 'lucide-react'
import { ExamSchedule } from '@/lib/types/database'
import { format } from 'date-fns'

interface ExamScheduleListProps {
  exams: ExamSchedule[]
  onAdd: () => void
  onEdit: (exam: ExamSchedule) => void
  onDelete: (id: string) => Promise<void>
  t: (key: string) => string
}

const categoryLabel: Record<string, string> = {
  recommendation: '推薦',
  common_test: '共通',
  general: '一般',
  certification: '検定',
  school_exam: '定期',
}

const categoryVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  recommendation: 'default',
  common_test: 'destructive',
  general: 'secondary',
  certification: 'outline',
  school_exam: 'outline',
}

export function ExamScheduleList({ exams, onAdd, onEdit, onDelete, t }: ExamScheduleListProps) {
  // Sort by date
  const sorted = [...exams].sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t('examTitle')}
          </CardTitle>
          <Button size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" />{t('addExam')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('examEmpty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">{t('examDate')}</th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">{t('examName')}</th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">{t('examMethod')}</th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">{t('examCategory')}</th>
                  <th className="py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(exam => (
                  <tr key={exam.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="py-2 px-2 whitespace-nowrap">
                      {format(new Date(exam.exam_date), 'M/d')}
                    </td>
                    <td className="py-2 px-2 font-medium">{exam.exam_name}</td>
                    <td className="py-2 px-2 text-muted-foreground">{exam.method || '—'}</td>
                    <td className="py-2 px-2">
                      <Badge variant={categoryVariant[exam.exam_category] || 'outline'}>
                        {categoryLabel[exam.exam_category] || exam.exam_category}
                      </Badge>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(exam)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(exam.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
