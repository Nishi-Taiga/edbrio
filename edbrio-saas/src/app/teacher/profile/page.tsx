"use client"

import { useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

type TeacherRow = {
  id: string
  handle: string
  subjects: string[]
  grades: string[]
  plan: 'free' | 'pro'
  public_profile: Record<string, any>
}

export default function TeacherProfilePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teacher, setTeacher] = useState<TeacherRow | null>(null)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setError(null)
        setLoading(true)
        const { data: session } = await supabase.auth.getSession()
        const uid = session.session?.user?.id
        if (!uid) { setTeacher(null); return }
        const { data, error } = await supabase
          .from('teachers')
          .select('id,handle,subjects,grades,plan,public_profile')
          .eq('id', uid)
          .maybeSingle()
        if (error) throw error
        if (mounted) setTeacher(data)
      } catch (e: any) {
        setError(e?.message || String(e))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [supabase])

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>プロフィール</CardTitle>
            <CardDescription>公開プロフィールの概要</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 text-sm bg-red-50 border border-red-200 rounded text-red-700">{error}</div>
            )}
            {loading ? (
              <div className="text-gray-500">読み込み中...</div>
            ) : !teacher ? (
              <div className="text-gray-500">プロフィールが見つかりません。</div>
            ) : (
              <div className="text-sm text-gray-700 space-y-2">
                <div><span className="font-medium">ハンドル:</span> {teacher.handle}</div>
                <div><span className="font-medium">科目:</span> {(teacher.subjects || []).join(' / ') || '-'}</div>
                <div><span className="font-medium">学年:</span> {(teacher.grades || []).join(' / ') || '-'}</div>
                <div><span className="font-medium">プラン:</span> {teacher.plan}</div>
                <div>
                  <span className="font-medium">公開プロフィール:</span>
                  <pre className="mt-1 p-2 bg-gray-50 border rounded overflow-x-auto">{JSON.stringify(teacher.public_profile || {}, null, 2)}</pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}

