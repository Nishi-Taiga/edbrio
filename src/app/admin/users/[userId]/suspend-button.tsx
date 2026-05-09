'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'

export function SuspendButton({ userId }: { userId: string }) {
  const router = useRouter()

  const handleSuspend = async () => {
    const res = await fetch(`/api/admin/users/${userId}/suspend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'suspend' }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Failed to suspend user')
    }
    router.refresh()
  }

  const handleUnsuspend = async () => {
    const res = await fetch(`/api/admin/users/${userId}/suspend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unsuspend' }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Failed to unsuspend user')
    }
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      <ConfirmDialog
        title="ユーザーを停止"
        description="このユーザーのアカウントを停止しますか？ログインできなくなります。"
        confirmLabel="停止する"
        variant="destructive"
        onConfirm={handleSuspend}
      >
        <Button variant="destructive" size="sm">アカウント停止</Button>
      </ConfirmDialog>

      <ConfirmDialog
        title="停止を解除"
        description="このユーザーのアカウント停止を解除しますか？"
        confirmLabel="解除する"
        onConfirm={handleUnsuspend}
      >
        <Button variant="outline" size="sm">停止解除</Button>
      </ConfirmDialog>
    </div>
  )
}
