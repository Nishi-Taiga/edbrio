"use client"

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText } from 'lucide-react'
import { SkeletonList } from '@/components/ui/skeleton-card'
import { ErrorAlert } from '@/components/ui/error-alert'
import { useAuth } from '@/hooks/use-auth'
import { useStudentProfiles } from '@/hooks/use-student-profiles'
import { useStudentCurriculum } from '@/hooks/use-student-curriculum'
import { createClient } from '@/lib/supabase/client'
import { StudentProfile } from '@/lib/types/database'
import { CurriculumProfile } from '@/components/curriculum/curriculum-profile'
import { GoalList } from '@/components/curriculum/goal-list'
import { GoalForm } from '@/components/curriculum/goal-form'
import { UnitList } from '@/components/curriculum/unit-list'
import { UnitForm } from '@/components/curriculum/unit-form'
import { SkillList } from '@/components/curriculum/skill-list'
import { SkillForm } from '@/components/curriculum/skill-form'
import { useHandoverNotes } from '@/hooks/use-handover-notes'
import { HandoverNoteList } from '@/components/curriculum/handover-note-list'
import { HandoverNoteForm } from '@/components/curriculum/handover-note-form'
import { useTranslations } from 'next-intl'

export default function StudentCurriculumPage() {
  const params = useParams()
  const profileId = params.profileId as string
  const tPage = useTranslations('curriculum.page')
  const { user, loading: authLoading } = useAuth()
  const { updateProfile } = useStudentProfiles(user?.id)
  const { goals, units, skills, loading: curriculumLoading, error: curriculumError, addGoal, updateGoal, deleteGoal, addUnit, updateUnit, deleteUnit, addSkill, updateSkill, deleteSkill } = useStudentCurriculum(profileId)
  const { notes: handoverNotes, loading: handoverLoading, error: handoverError, addNote, deleteNote: deleteHandoverNote } = useHandoverNotes(profileId)
  const supabase = useMemo(() => createClient(), [])

  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialogs
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [showUnitForm, setShowUnitForm] = useState(false)
  const [showSkillForm, setShowSkillForm] = useState(false)
  const [showHandoverForm, setShowHandoverForm] = useState(false)

  useEffect(() => {
    if (!profileId) return
    let mounted = true
    async function load() {
      try {
        const { data, error: err } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('id', profileId)
          .single()
        if (err) throw err
        if (mounted) setProfile(data)
      } catch (e: unknown) {
        if (mounted) setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [profileId, supabase])

  const handleUpdateProfile = async (id: string, updates: Partial<StudentProfile>) => {
    await updateProfile(id, updates)
    const { data } = await supabase.from('student_profiles').select('*').eq('id', id).single()
    if (data) setProfile(data)
  }

  const anyError = error || curriculumError || handoverError

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-4">
          <Link href="/teacher/students" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">{tPage('breadcrumb')}</Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">{profile?.name || tPage('loading')}</span>
        </nav>

        {(loading || authLoading) ? (
          <SkeletonList count={3} />
        ) : !profile ? (
          <ErrorAlert message={tPage('notFound')} />
        ) : (<>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{profile.name}</h1>
            {profile.grade && <p className="text-gray-600 dark:text-gray-400 text-sm">{profile.grade}</p>}
          </div>
          <Link href={`/teacher/reports/new?profileId=${profileId}`}>
            <Button>
              <FileText className="w-4 h-4 mr-1" />{tPage('createReport')}
            </Button>
          </Link>
        </div>

        {anyError && <ErrorAlert message={anyError} />}

        {/* Tabs */}
        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">{tPage('tabProfile')}</TabsTrigger>
            <TabsTrigger value="units">{tPage('tabCurriculum')}</TabsTrigger>
            <TabsTrigger value="goals">{tPage('tabGoals')}</TabsTrigger>
            <TabsTrigger value="skills">{tPage('tabSkills')}</TabsTrigger>
            <TabsTrigger value="handover">{tPage('tabHandover')}</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <CurriculumProfile profile={profile} onUpdate={handleUpdateProfile} />
          </TabsContent>

          <TabsContent value="units">
            {curriculumLoading ? (
              <div className="text-gray-500">{tPage('loading')}</div>
            ) : (
              <UnitList units={units} onAdd={() => setShowUnitForm(true)} onUpdate={updateUnit} onDelete={deleteUnit} />
            )}
          </TabsContent>

          <TabsContent value="goals">
            {curriculumLoading ? (
              <div className="text-gray-500">{tPage('loading')}</div>
            ) : (
              <GoalList goals={goals} onAdd={() => setShowGoalForm(true)} onUpdate={updateGoal} onDelete={deleteGoal} />
            )}
          </TabsContent>

          <TabsContent value="skills">
            {curriculumLoading ? (
              <div className="text-gray-500">{tPage('loading')}</div>
            ) : (
              <SkillList skills={skills} onAdd={() => setShowSkillForm(true)} onUpdate={updateSkill} onDelete={deleteSkill} />
            )}
          </TabsContent>

          <TabsContent value="handover">
            {handoverLoading ? (
              <div className="text-gray-500">{tPage('loading')}</div>
            ) : (
              <HandoverNoteList notes={handoverNotes} onAdd={() => setShowHandoverForm(true)} onDelete={deleteHandoverNote} />
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <GoalForm open={showGoalForm} onClose={() => setShowGoalForm(false)} onSubmit={addGoal} />
        <UnitForm open={showUnitForm} onClose={() => setShowUnitForm(false)} onSubmit={addUnit} />
        <SkillForm open={showSkillForm} onClose={() => setShowSkillForm(false)} onSubmit={addSkill} />
        <HandoverNoteForm open={showHandoverForm} onClose={() => setShowHandoverForm(false)} onSubmit={addNote} />
        </>)}
      </div>
    </ProtectedRoute>
  )
}
