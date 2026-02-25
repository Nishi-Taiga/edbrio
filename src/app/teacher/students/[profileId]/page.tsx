"use client"

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, FileText } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useStudentProfiles } from '@/hooks/use-student-profiles'
import { useStudentKarte } from '@/hooks/use-student-karte'
import { createClient } from '@/lib/supabase/client'
import { StudentProfile } from '@/lib/types/database'
import { KarteProfile } from '@/components/karte/karte-profile'
import { GoalList } from '@/components/karte/goal-list'
import { GoalForm } from '@/components/karte/goal-form'
import { WeakPointList } from '@/components/karte/weak-point-list'
import { StrengthList } from '@/components/karte/strength-list'
import { PointForm } from '@/components/karte/point-form'
import { useHandoverNotes } from '@/hooks/use-handover-notes'
import { HandoverNoteList } from '@/components/karte/handover-note-list'
import { HandoverNoteForm } from '@/components/karte/handover-note-form'

export default function StudentKartePage() {
  const params = useParams()
  const profileId = params.profileId as string
  const { user, loading: authLoading } = useAuth()
  const { updateProfile } = useStudentProfiles(user?.id)
  const { goals, weakPoints, strengths, loading: karteLoading, error: karteError, addGoal, updateGoal, deleteGoal, addWeakPoint, updateWeakPoint, deleteWeakPoint, addStrength, deleteStrength } = useStudentKarte(profileId)
  const { notes: handoverNotes, loading: handoverLoading, error: handoverError, addNote, deleteNote: deleteHandoverNote } = useHandoverNotes(profileId)
  const supabase = useMemo(() => createClient(), [])

  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialogs
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [showWeakPointForm, setShowWeakPointForm] = useState(false)
  const [showStrengthForm, setShowStrengthForm] = useState(false)
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
    // Refresh local profile state
    const { data } = await supabase.from('student_profiles').select('*').eq('id', id).single()
    if (data) setProfile(data)
  }

  const anyError = error || karteError || handoverError

  if (loading || authLoading) {
    return (
      <ProtectedRoute allowedRoles={["teacher"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!profile) {
    return (
      <ProtectedRoute allowedRoles={["teacher"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-red-600">生徒が見つかりません。</div>
          <Link href="/teacher/students">
            <Button variant="outline" className="mt-4"><ArrowLeft className="w-4 h-4 mr-1" />一覧に戻る</Button>
          </Link>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/teacher/students">
              <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{profile.name}</h1>
              {profile.grade && <p className="text-gray-600 dark:text-gray-400 text-sm">{profile.grade}</p>}
            </div>
          </div>
          <Link href={`/teacher/reports/new?profileId=${profileId}`}>
            <Button>
              <FileText className="w-4 h-4 mr-1" />レポート作成
            </Button>
          </Link>
        </div>

        {anyError && (
          <div className="mb-4 p-3 text-sm bg-red-50 border border-red-200 rounded text-red-700">{anyError}</div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">基本情報</TabsTrigger>
            <TabsTrigger value="goals">学習目標</TabsTrigger>
            <TabsTrigger value="points">つまずき・得意</TabsTrigger>
            <TabsTrigger value="handover">引継ぎメモ</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <KarteProfile profile={profile} onUpdate={handleUpdateProfile} />
          </TabsContent>

          <TabsContent value="goals">
            {karteLoading ? (
              <div className="text-gray-500">読み込み中...</div>
            ) : (
              <GoalList goals={goals} onAdd={() => setShowGoalForm(true)} onUpdate={updateGoal} onDelete={deleteGoal} />
            )}
          </TabsContent>

          <TabsContent value="points">
            {karteLoading ? (
              <div className="text-gray-500">読み込み中...</div>
            ) : (
              <div className="space-y-6">
                <WeakPointList weakPoints={weakPoints} onAdd={() => setShowWeakPointForm(true)} onUpdate={updateWeakPoint} onDelete={deleteWeakPoint} />
                <StrengthList strengths={strengths} onAdd={() => setShowStrengthForm(true)} onDelete={deleteStrength} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="handover">
            {handoverLoading ? (
              <div className="text-gray-500">読み込み中...</div>
            ) : (
              <HandoverNoteList notes={handoverNotes} onAdd={() => setShowHandoverForm(true)} onDelete={deleteHandoverNote} />
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <GoalForm open={showGoalForm} onClose={() => setShowGoalForm(false)} onSubmit={addGoal} />
        <PointForm open={showWeakPointForm} onClose={() => setShowWeakPointForm(false)} type="weakness" onSubmitWeakness={addWeakPoint} />
        <PointForm open={showStrengthForm} onClose={() => setShowStrengthForm(false)} type="strength" onSubmitStrength={addStrength} />
        <HandoverNoteForm open={showHandoverForm} onClose={() => setShowHandoverForm(false)} onSubmit={addNote} />
      </div>
    </ProtectedRoute>
  )
}
