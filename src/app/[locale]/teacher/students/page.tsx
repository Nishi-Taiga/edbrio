"use client"

import { useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Search, Users } from 'lucide-react'
import { SkeletonList } from '@/components/ui/skeleton-card'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorAlert } from '@/components/ui/error-alert'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { useStudentProfiles } from '@/hooks/use-student-profiles'
import { LoadingButton } from '@/components/ui/loading-button'
import { StudentCard } from '@/components/curriculum/student-card'
import { useTranslations } from 'next-intl'

export default function TeacherStudentsPage() {
  const t = useTranslations('teacherStudents')
  const tc = useTranslations('common')
  const { user, loading: authLoading } = useAuth()
  const { profiles, loading, error, createProfile } = useStudentProfiles(user?.id)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newGrade, setNewGrade] = useState('')
  const [newSubjects, setNewSubjects] = useState('')
  const [saving, setSaving] = useState(false)

  const filtered = profiles.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.grade || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = async () => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      await createProfile({
        name: newName.trim(),
        grade: newGrade.trim() || undefined,
        subjects: newSubjects.split(',').map(s => s.trim()).filter(Boolean),
        status: 'active',
      } as any)
      setNewName(''); setNewGrade(''); setNewSubjects('')
      setShowAdd(false)
      toast.success(t('addSuccess'))
    } catch {
      toast.error(t('addError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
            <p className="text-gray-600 dark:text-slate-400 text-sm mt-1">{t('description')}</p>
          </div>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 mr-1" />{t('addStudent')}
          </Button>
        </div>

        {error && <ErrorAlert message={error} />}

        {profiles.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
            <Input
              className="pl-10"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}

        {loading || authLoading ? (
          <SkeletonList count={3} />
        ) : filtered.length === 0 ? (
          profiles.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t('emptyTitle')}
              description={t('emptyDescription')}
              action={{ label: t('emptyAction'), onClick: () => setShowAdd(true) }}
            />
          ) : (
            <EmptyState
              icon={Search}
              title={t('noSearchResults')}
              description={t('noSearchResultsDescription')}
            />
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => (
              <StudentCard key={p.id} profile={p} />
            ))}
          </div>
        )}

        {/* Add Student Dialog */}
        <Dialog open={showAdd} onOpenChange={v => !v && setShowAdd(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('addDialogTitle')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="add-name">{t('nameLabel')}</Label>
                <Input id="add-name" value={newName} onChange={e => setNewName(e.target.value)} placeholder={t('namePlaceholder')} />
              </div>
              <div>
                <Label htmlFor="add-grade">{t('gradeLabel')}</Label>
                <Input id="add-grade" value={newGrade} onChange={e => setNewGrade(e.target.value)} placeholder={t('gradePlaceholder')} />
              </div>
              <div>
                <Label htmlFor="add-subjects">{t('subjectsLabel')}</Label>
                <Input id="add-subjects" value={newSubjects} onChange={e => setNewSubjects(e.target.value)} placeholder={t('subjectsPlaceholder')} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)} disabled={saving}>{tc('cancel')}</Button>
              <LoadingButton onClick={handleAdd} loading={saving} disabled={!newName.trim()}>
                {tc('add')}
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
