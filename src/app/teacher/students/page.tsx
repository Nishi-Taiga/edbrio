"use client"

import { useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Search } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useStudentProfiles } from '@/hooks/use-student-profiles'
import { StudentCard } from '@/components/karte/student-card'

export default function TeacherStudentsPage() {
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
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">生徒カルテ</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">生徒の学習情報を管理</p>
          </div>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 mr-1" />生徒を追加
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm bg-red-50 border border-red-200 rounded text-red-700">{error}</div>
        )}

        {profiles.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="生徒名・学年で検索..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}

        {loading || authLoading ? (
          <div className="text-gray-500">読み込み中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              {profiles.length === 0 ? '生徒が登録されていません。' : '検索結果がありません。'}
            </p>
            {profiles.length === 0 && (
              <Button onClick={() => setShowAdd(true)}>
                <Plus className="w-4 h-4 mr-1" />最初の生徒を追加
              </Button>
            )}
          </div>
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
              <DialogTitle>生徒を追加</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="add-name">名前 *</Label>
                <Input id="add-name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="山田 太郎" />
              </div>
              <div>
                <Label htmlFor="add-grade">学年</Label>
                <Input id="add-grade" value={newGrade} onChange={e => setNewGrade(e.target.value)} placeholder="例: 中学2年" />
              </div>
              <div>
                <Label htmlFor="add-subjects">受講科目（カンマ区切り）</Label>
                <Input id="add-subjects" value={newSubjects} onChange={e => setNewSubjects(e.target.value)} placeholder="例: 数学, 英語" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)} disabled={saving}>キャンセル</Button>
              <Button onClick={handleAdd} disabled={saving || !newName.trim()}>
                {saving ? '追加中...' : '追加'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
