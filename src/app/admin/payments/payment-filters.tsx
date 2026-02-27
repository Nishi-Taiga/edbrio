'use client'

import { useRouter } from 'next/navigation'

interface PaymentFiltersProps {
  status?: string
}

export function PaymentFilters({ status = 'all' }: PaymentFiltersProps) {
  const router = useRouter()

  function apply(newStatus: string) {
    const q = new URLSearchParams()
    if (newStatus && newStatus !== 'all') q.set('status', newStatus)
    router.push(`/admin/payments?${q.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <select
        value={status}
        onChange={(e) => apply(e.target.value)}
        className="rounded border px-3 py-1.5 text-sm bg-background"
      >
        <option value="all">全ステータス</option>
        <option value="completed">完了</option>
        <option value="pending">保留</option>
        <option value="failed">失敗</option>
        <option value="refunded">返金</option>
      </select>
    </div>
  )
}
