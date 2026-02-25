"use client"

import { useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

type TicketRow = {
  id: string
  name: string
  minutes: number
  bundle_qty: number
  price_cents: number
  valid_days: number
  is_active: boolean
}

export default function TeacherTicketsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<TicketRow[]>([])

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setError(null)
        setLoading(true)
        const { data: session } = await supabase.auth.getSession()
        const uid = session.session?.user?.id
        if (!uid) { setItems([]); return }
        const { data, error } = await supabase
          .from('tickets')
          .select('id,name,minutes,bundle_qty,price_cents,valid_days,is_active')
          .eq('teacher_id', uid)
          .order('created_at', { ascending: false })
          .limit(100)
        if (error) throw error
        if (mounted) setItems(data || [])
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [supabase])

  const formatYen = (cents: number) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format((cents || 0) / 100)

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>チケット</CardTitle>
            <CardDescription>販売中のチケット一覧</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (<div className="mb-4 p-3 text-sm bg-red-50 border border-red-200 rounded text-red-700 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400">{error}</div>)}
            {loading ? (
              <div className="text-gray-500 dark:text-slate-400">読み込み中...</div>
            ) : items.length === 0 ? (
              <div className="text-gray-500 dark:text-slate-400">チケットがありません。</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {items.map((t) => (
                  <Card key={t.id}>
                    <CardHeader>
                      <CardTitle className="text-sm">{t.name}</CardTitle>
                      <CardDescription>{t.is_active ? '公開中' : '非公開'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-700 dark:text-slate-300 space-y-1">
                        <div>時間: {t.minutes}分 × {t.bundle_qty}回</div>
                        <div>価格: {formatYen(t.price_cents)}</div>
                        <div>有効期限: {t.valid_days}日</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}

