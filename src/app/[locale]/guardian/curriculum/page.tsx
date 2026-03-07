"use client"

import { useState, useEffect, useMemo } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BookOpen, Target, Calendar, TrendingUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { StudentProfile, CurriculumMaterial, CurriculumPhase, StudentGoal, ExamSchedule, TestScore } from '@/lib/types/database'
import { TestScoreChart } from '@/components/curriculum/test-score-chart'
import { SkeletonList } from '@/components/ui/skeleton-card'
import { format, isBefore, differenceInDays } from 'date-fns'

export default function GuardianCurriculumPage() {
  const t = useTranslations('guardianCurriculum')
  const { user, loading: authLoading } = useAuth()
  const supabase = useMemo(() => createClient(), [])

  const [profiles, setProfiles] = useState<StudentProfile[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Data for selected student
  const [materials, setMaterials] = useState<CurriculumMaterial[]>([])
  const [phases, setPhases] = useState<CurriculumPhase[]>([])
  const [goals, setGoals] = useState<StudentGoal[]>([])
  const [exams, setExams] = useState<ExamSchedule[]>([])
  const [scores, setScores] = useState<TestScore[]>([])
  const [dataLoading, setDataLoading] = useState(false)

  // Load student profiles for this guardian
  useEffect(() => {
    if (!user?.id) return
    let mounted = true
    async function load() {
      try {
        const { data } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('guardian_id', user!.id)
          .order('name')
        if (mounted && data) {
          setProfiles(data)
          if (data.length > 0 && !selectedProfileId) {
            setSelectedProfileId(data[0].id)
          }
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [user?.id, supabase, selectedProfileId])

  // Load curriculum data for selected student
  useEffect(() => {
    if (!selectedProfileId) return
    let mounted = true
    async function loadData() {
      setDataLoading(true)
      try {
        const [matsRes, goalsRes, examsRes, scoresRes] = await Promise.all([
          supabase.from('curriculum_materials').select('*').eq('profile_id', selectedProfileId).order('order_index'),
          supabase.from('student_goals').select('*').eq('profile_id', selectedProfileId).order('created_at', { ascending: false }),
          supabase.from('exam_schedules').select('*').eq('profile_id', selectedProfileId).order('exam_date'),
          supabase.from('test_scores').select('*').eq('profile_id', selectedProfileId).order('test_date', { ascending: false }),
        ])
        if (!mounted) return
        const fetchedMaterials = matsRes.data || []
        setMaterials(fetchedMaterials)
        setGoals(goalsRes.data || [])
        setExams(examsRes.data || [])
        setScores(scoresRes.data || [])

        if (fetchedMaterials.length > 0) {
          const materialIds = fetchedMaterials.map(m => m.id)
          const { data: phasesData } = await supabase
            .from('curriculum_phases')
            .select('*')
            .in('material_id', materialIds)
            .order('order_index')
          if (mounted) setPhases(phasesData || [])
        } else {
          if (mounted) setPhases([])
        }
      } finally {
        if (mounted) setDataLoading(false)
      }
    }
    loadData()
    return () => { mounted = false }
  }, [selectedProfileId, supabase])

  const selectedProfile = profiles.find(p => p.id === selectedProfileId)
  const today = new Date()

  // Subject progress
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

  const activeGoals = goals.filter(g => g.status === 'active')
  const upcomingExams = exams.filter(e => !isBefore(new Date(e.exam_date), today)).slice(0, 5)
  const latestScores = scores.slice(0, 5)

  return (
    <ProtectedRoute allowedRoles={["guardian"]}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{t('title')}</h1>

        {(loading || authLoading) ? (
          <SkeletonList count={3} />
        ) : profiles.length === 0 ? (
          <p className="text-muted-foreground">{t('noStudents')}</p>
        ) : (
          <>
            {/* Student selector */}
            {profiles.length > 1 && (
              <div className="flex gap-2 mb-6 flex-wrap">
                {profiles.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProfileId(p.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      p.id === selectedProfileId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}

            {dataLoading ? (
              <SkeletonList count={3} />
            ) : selectedProfile && (
              <div className="space-y-6">
                {/* Profile summary */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      <div><span className="text-muted-foreground">{t('name')}:</span> <span className="font-medium">{selectedProfile.name}</span></div>
                      {selectedProfile.grade && <div><span className="text-muted-foreground">{t('grade')}:</span> <span className="font-medium">{selectedProfile.grade}</span></div>}
                      {selectedProfile.school && <div><span className="text-muted-foreground">{t('school')}:</span> <span className="font-medium">{selectedProfile.school}</span></div>}
                      {selectedProfile.curriculum_year && <div><span className="text-muted-foreground">{t('year')}:</span> <span className="font-medium">{selectedProfile.curriculum_year}</span></div>}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Subject progress */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        {t('progress')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {subjectProgress.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t('noMaterials')}</p>
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
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        {t('goals')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {activeGoals.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t('noGoals')}</p>
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
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {t('exams')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {upcomingExams.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t('noExams')}</p>
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
                                    {t('daysLeft').replace('{days}', String(daysUntil))}
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
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        {t('scores')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {latestScores.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t('noScores')}</p>
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

                {/* Test score chart */}
                {scores.length > 0 && (
                  <TestScoreChart scores={scores} t={(key: string) => t(key)} />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  )
}
