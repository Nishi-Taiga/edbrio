'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BookOpen, Target, ClipboardList, Calendar, Plus, TrendingUp } from 'lucide-react'
import { StudentProfile, CurriculumMaterial, CurriculumPhase, StudentGoal, ExamSchedule, TestScore } from '@/lib/types/database'
import { format, isBefore, differenceInDays } from 'date-fns'

interface CurriculumOverviewProps {
  profile: StudentProfile
  materials: CurriculumMaterial[]
  phases: CurriculumPhase[]
  goals: StudentGoal[]
  exams: ExamSchedule[]
  scores: TestScore[]
  onNavigateTab: (tab: string) => void
  t: (key: string) => string
}

export function CurriculumOverview({
  profile,
  materials,
  phases,
  goals,
  exams,
  scores,
  onNavigateTab,
  t,
}: CurriculumOverviewProps) {
  const today = new Date()

  // Subject progress calculation
  const subjectProgress = (() => {
    const subjects = new Map<string, { total: number; completed: number }>()
    materials.forEach(m => {
      if (!subjects.has(m.subject)) subjects.set(m.subject, { total: 0, completed: 0 })
    })
    phases.forEach(p => {
      const material = materials.find(m => m.id === p.material_id)
      if (!material) return
      const entry = subjects.get(material.subject)
      if (!entry) return
      entry.total++
      if (p.status === 'completed') entry.completed++
    })
    return Array.from(subjects.entries()).map(([subject, data]) => ({
      subject,
      ...data,
      pct: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    }))
  })()

  // Active goals
  const activeGoals = goals.filter(g => g.status === 'active').slice(0, 3)

  // Upcoming exams (next 3 future exams)
  const upcomingExams = exams
    .filter(e => !isBefore(new Date(e.exam_date), today))
    .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())
    .slice(0, 3)

  // Latest test scores (last 3)
  const latestScores = [...scores]
    .sort((a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime())
    .slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Profile summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div><span className="text-muted-foreground">{t('overviewName')}:</span> <span className="font-medium">{profile.name}</span></div>
            {profile.grade && <div><span className="text-muted-foreground">{t('overviewGrade')}:</span> <span className="font-medium">{profile.grade}</span></div>}
            {profile.school && <div><span className="text-muted-foreground">{t('overviewSchool')}:</span> <span className="font-medium">{profile.school}</span></div>}
            {profile.curriculum_year && <div><span className="text-muted-foreground">{t('overviewYear')}:</span> <span className="font-medium">{profile.curriculum_year}</span></div>}
            {profile.curriculum_title && <div><span className="text-muted-foreground">{t('overviewTitle')}:</span> <span className="font-medium">{profile.curriculum_title}</span></div>}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subject progress */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {t('overviewProgress')}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigateTab('curriculum')}>
                {t('overviewViewAll')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {subjectProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('overviewNoMaterials')}</p>
            ) : (
              <div className="space-y-3">
                {subjectProgress.map(sp => (
                  <div key={sp.subject}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{sp.subject}</span>
                      <span className="text-muted-foreground">{sp.completed}/{sp.total} ({sp.pct}%)</span>
                    </div>
                    <Progress value={sp.pct} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active goals */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4" />
                {t('overviewGoals')}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigateTab('goals')}>
                {t('overviewViewAll')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activeGoals.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('overviewNoGoals')}</p>
            ) : (
              <div className="space-y-3">
                {activeGoals.map(goal => (
                  <div key={goal.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate mr-2">{goal.title}</span>
                      <span className="text-muted-foreground flex-shrink-0">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming exams */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t('overviewExams')}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigateTab('curriculum')}>
                {t('overviewViewAll')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingExams.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('overviewNoExams')}</p>
            ) : (
              <div className="space-y-2">
                {upcomingExams.map(exam => {
                  const daysUntil = differenceInDays(new Date(exam.exam_date), today)
                  return (
                    <div key={exam.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{exam.exam_name}</span>
                        {exam.method && <span className="text-muted-foreground text-xs">({exam.method})</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{format(new Date(exam.exam_date), 'M/d')}</span>
                        <Badge variant={daysUntil <= 14 ? 'destructive' : 'outline'} className="text-xs">
                          {t('overviewDaysLeft').replace('{days}', String(daysUntil))}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest test scores */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {t('overviewScores')}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigateTab('scores')}>
                {t('overviewViewAll')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {latestScores.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('overviewNoScores')}</p>
            ) : (
              <div className="space-y-2">
                {latestScores.map(score => {
                  const pct = (score.score / score.max_score) * 100
                  return (
                    <div key={score.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{score.test_name}</span>
                        <Badge variant="outline" className="text-xs">{score.subject}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono ${pct >= 80 ? 'text-green-600' : pct >= 60 ? '' : 'text-red-600'}`}>
                          {score.score}/{score.max_score}
                        </span>
                        <span className="text-muted-foreground text-xs">{format(new Date(score.test_date), 'M/d')}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
