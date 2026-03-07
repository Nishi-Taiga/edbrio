'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, BookOpen } from 'lucide-react'
import { LessonLog, LessonLogPhase, CurriculumPhase } from '@/lib/types/database'
import { format } from 'date-fns'

interface LessonLogListProps {
  logs: LessonLog[]
  logPhases: LessonLogPhase[]
  phases: CurriculumPhase[]
  onAdd: () => void
  onDelete: (id: string) => Promise<void>
  t: (key: string) => string
}

export function LessonLogList({ logs, logPhases, phases, onAdd, onDelete, t }: LessonLogListProps) {
  const sorted = [...logs].sort((a, b) => new Date(b.lesson_date).getTime() - new Date(a.lesson_date).getTime())

  // Build phase name lookup
  const phaseMap = new Map(phases.map(p => [p.id, p]))

  // Get phases for a log
  const getPhasesForLog = (logId: string) =>
    logPhases
      .filter(lp => lp.lesson_log_id === logId)
      .map(lp => ({ ...lp, phase: phaseMap.get(lp.phase_id) }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {t('logTitle')}
          </CardTitle>
          <Button size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" />{t('addLog')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('logEmpty')}</p>
        ) : (
          <div className="space-y-3">
            {sorted.map(log => {
              const logPhaseEntries = getPhasesForLog(log.id)
              return (
                <div key={log.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {format(new Date(log.lesson_date), 'M/d')}
                        </span>
                        <Badge variant="outline">{log.subject}</Badge>
                      </div>
                      {logPhaseEntries.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {logPhaseEntries.map(entry => (
                            <Badge key={entry.id} variant="secondary" className="text-xs">
                              {entry.phase?.phase_name || t('unknownPhase')}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {log.notes && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{log.notes}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive flex-shrink-0" onClick={() => onDelete(log.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
