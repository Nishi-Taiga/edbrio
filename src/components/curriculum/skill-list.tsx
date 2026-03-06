'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Star } from 'lucide-react'
import { SkillAssessment } from '@/lib/types/database'
import { useTranslations } from 'next-intl'

interface SkillListProps {
  skills: SkillAssessment[]
  onAdd: () => void
  onUpdate: (id: string, updates: Partial<SkillAssessment>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const ratingColor: Record<number, string> = {
  1: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
  2: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
  3: 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700',
  4: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800',
  5: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
}

export function SkillList({ skills, onAdd, onUpdate, onDelete }: SkillListProps) {
  const t = useTranslations('curriculum.skills')

  const ratingLabel: Record<number, string> = {
    1: t('rating1'),
    2: t('rating2'),
    3: t('rating3'),
    4: t('rating4'),
    5: t('rating5'),
  }

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
        {skills.length === 0 ? (
          <p className="text-gray-500 text-sm">{t('empty')}</p>
        ) : (
          <div className="space-y-2">
            {skills.map(skill => (
              <div key={skill.id} className={`border rounded-lg p-3 ${ratingColor[skill.rating] || ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{skill.subject} - {skill.topic}</div>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => onUpdate(skill.id, { rating: star, last_assessed_at: new Date().toISOString().split('T')[0] })}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`w-4 h-4 ${star <= skill.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 dark:text-gray-600'}`}
                          />
                        </button>
                      ))}
                      <span className="text-xs text-gray-500 ml-2">{ratingLabel[skill.rating]}</span>
                    </div>
                    {skill.notes && <p className="text-xs text-gray-500 mt-1">{skill.notes}</p>}
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => onDelete(skill.id)}>
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
