'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, CheckCircle, PauseCircle } from 'lucide-react'
import { StudentGoal } from '@/lib/types/database'

interface GoalListProps {
  goals: StudentGoal[]
  onAdd: () => void
  onUpdate: (id: string, updates: Partial<StudentGoal>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const statusLabel: Record<string, string> = { active: '進行中', achieved: '達成', paused: '休止' }
const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = { active: 'default', achieved: 'secondary', paused: 'outline' }

export function GoalList({ goals, onAdd, onUpdate, onDelete }: GoalListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>学習目標</CardTitle>
          <Button size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" />追加
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <p className="text-gray-500 text-sm">学習目標が登録されていません。</p>
        ) : (
          <div className="space-y-3">
            {goals.map(g => (
              <div key={g.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-sm">{g.title}</div>
                    {g.subject && <span className="text-xs text-gray-500">{g.subject}</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={statusVariant[g.status] || 'outline'}>{statusLabel[g.status] || g.status}</Badge>
                  </div>
                </div>
                {g.description && <p className="text-sm text-gray-600 mb-2">{g.description}</p>}
                {/* Progress bar */}
                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>進捗</span>
                    <span>{g.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  {g.status === 'active' && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => onUpdate(g.id, { status: 'achieved', progress: 100 })}>
                        <CheckCircle className="w-4 h-4 mr-1" />達成
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onUpdate(g.id, { status: 'paused' })}>
                        <PauseCircle className="w-4 h-4 mr-1" />休止
                      </Button>
                    </>
                  )}
                  {g.status !== 'active' && (
                    <Button variant="ghost" size="sm" onClick={() => onUpdate(g.id, { status: 'active' })}>
                      再開
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => onDelete(g.id)}>
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
