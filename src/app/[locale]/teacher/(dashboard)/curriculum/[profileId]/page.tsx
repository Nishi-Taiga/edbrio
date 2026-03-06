"use client"

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { FileEdit } from 'lucide-react'
import { SkeletonList } from '@/components/ui/skeleton-card'
import { ErrorAlert } from '@/components/ui/error-alert'
import { useAuth } from '@/hooks/use-auth'
import { useStudentProfiles } from '@/hooks/use-student-profiles'
import { useStudentCurriculum } from '@/hooks/use-student-curriculum'
import { createClient } from '@/lib/supabase/client'
import { StudentProfile } from '@/lib/types/database'
import { CurriculumProfile } from '@/components/curriculum/curriculum-profile'
import { UnitList } from '@/components/curriculum/unit-list'
import { UnitForm } from '@/components/curriculum/unit-form'
import { useTranslations } from 'next-intl'
import { LoadingButton } from '@/components/ui/loading-button'

export default function StudentCurriculumPage() {
  const params = useParams()
  const profileId = params.profileId as string
  const tPage = useTranslations('curriculum.page')
  const tProfile = useTranslations('curriculum.profile')
  const tc = useTranslations('common')
  const { user, loading: authLoading } = useAuth()
  const { updateProfile } = useStudentProfiles(user?.id)
  const { units, loading: curriculumLoading, error: curriculumError, addUnit, updateUnit, deleteUnit } = useStudentCurriculum(profileId)
  const supabase = useMemo(() => createClient(), [])

  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialogs
  const [showUnitForm, setShowUnitForm] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [detailText, setDetailText] = useState('')
  const [savingDetail, setSavingDetail] = useState(false)

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

  const handleOpenDetail = () => {
    setDetailText(profile?.personality_notes || '')
    setShowDetailDialog(true)
  }

  const handleSaveDetail = async () => {
    if (!profile) return
    setSavingDetail(true)
    try {
      await handleUpdateProfile(profile.id, { personality_notes: detailText || undefined })
      setShowDetailDialog(false)
    } finally {
      setSavingDetail(false)
    }
  }

  const anyError = error || curriculumError

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-4">
          <Link href="/teacher/curriculum" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">{tPage('breadcrumb')}</Link>
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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{profile.name}</h1>
            {profile.grade && <p className="text-gray-600 dark:text-gray-400 text-sm">{profile.grade}</p>}
            <Button variant="outline" size="sm" onClick={handleOpenDetail}>
              <FileEdit className="w-4 h-4 mr-1" />{tProfile('detailButton')}
            </Button>
          </div>
        </div>

        {anyError && <ErrorAlert message={anyError} />}

        {/* Tabs */}
        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">{tPage('tabProfile')}</TabsTrigger>
            <TabsTrigger value="units">{tPage('tabCurriculum')}</TabsTrigger>
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
        </Tabs>

        {/* Dialogs */}
        <UnitForm open={showUnitForm} onClose={() => setShowUnitForm(false)} onSubmit={addUnit} />

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={v => !v && setShowDetailDialog(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{tProfile('detailDialogTitle')}</DialogTitle>
              <DialogDescription>{tProfile('detailDialogDescription')}</DialogDescription>
            </DialogHeader>
            <textarea
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px]"
              value={detailText}
              onChange={e => setDetailText(e.target.value)}
              placeholder={tProfile('personalityPlaceholder')}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailDialog(false)} disabled={savingDetail}>{tc('cancel')}</Button>
              <LoadingButton onClick={handleSaveDetail} loading={savingDetail}>
                {tc('save')}
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </>)}
      </div>
    </ProtectedRoute>
  )
}
