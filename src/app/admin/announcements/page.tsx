'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { SkeletonList } from '@/components/ui/skeleton-card'
import { ErrorAlert } from '@/components/ui/error-alert'
import { EmptyState } from '@/components/ui/empty-state'
import { Megaphone, Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { toast } from 'sonner'

interface Announcement {
  id: string
  title: string
  content: string
  target_role: string | null
  created_at: string
}

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [targetRole, setTargetRole] = useState<string>('all')
  const [creating, setCreating] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/announcements')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setItems(data.announcements || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          target_role: targetRole === 'all' ? null : targetRole,
        }),
      })
      if (!res.ok) throw new Error('Failed to create')
      toast.success('お知らせを作成しました')
      setTitle('')
      setContent('')
      setTargetRole('all')
      setCreateOpen(false)
      load()
    } catch {
      toast.error('作成に失敗しました')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/announcements/${deleteConfirm}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('お知らせを削除しました')
      setDeleteConfirm(null)
      load()
    } catch {
      toast.error('削除に失敗しました')
    } finally {
      setDeleting(false)
    }
  }

  const roleLabel = (role: string | null) => {
    if (!role) return '全員'
    if (role === 'teacher') return '教師'
    if (role === 'guardian') return '保護者'
    return role
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">お知らせ管理</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> 新規作成
        </Button>
      </div>

      {error && <ErrorAlert message={error} />}

      {loading ? (
        <SkeletonList count={3} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="お知らせがありません"
          description="新規作成ボタンからお知らせを作成してください"
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{item.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {roleLabel(item.target_role)}
                    </span>
                    <span className="text-xs text-slate-400">
                      {format(new Date(item.created_at), 'PPP', { locale: ja })}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 h-7 w-7 p-0"
                      onClick={() => setDeleteConfirm(item.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{item.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>お知らせを作成</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">タイトル</label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="お知らせのタイトル"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">内容</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-ring"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="お知らせの内容"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">対象</label>
              <Select value={targetRole} onValueChange={setTargetRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全員</SelectItem>
                  <SelectItem value="teacher">教師のみ</SelectItem>
                  <SelectItem value="guardian">保護者のみ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>キャンセル</Button>
            <Button onClick={handleCreate} disabled={creating || !title.trim() || !content.trim()}>
              {creating ? '作成中...' : '作成'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(o) => { if (!o) setDeleteConfirm(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>お知らせを削除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 dark:text-slate-400">このお知らせを削除しますか？</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={deleting}>キャンセル</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? '削除中...' : '削除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
