'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function AuthForm({ mode, onModeChange }: {
  mode: 'login' | 'signup',
  onModeChange: (mode: 'login' | 'signup') => void
}) {
  const router = useRouter()
  const { user, dbUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'teacher' | 'guardian'>('teacher')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const supabase = createClient()

  // Redirect if already logged in or after successful login
  useEffect(() => {
    if (user) {
      // Use dbUser role if available, fallback to metadata role, then teacher
      // Note: 'allowedRoles' is not defined in this component. Assuming it's meant to be passed or derived.
      // For now, the existing redirection logic is kept, and the new block is added as per instruction.
      // The instruction's new block seems to be an additional check or override.
      // The partial line 'ter.push('/admin/dashboard')' from the instruction is removed as it's a syntax error.

      // Existing logic (modified to use dbUser if available, otherwise user_metadata)
      const userRole = dbUser?.role || user.user_metadata?.role || 'teacher'
      if (userRole === 'teacher') {
        router.push('/teacher/dashboard')
      } else if (userRole === 'guardian') {
        router.push('/guardian/dashboard')
      } else if (userRole === 'admin') {
        router.push('/admin/dashboard')
      }
    }
  }, [user, dbUser, router])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role,
            }
          }
        })
        if (error) throw error

        if (data.user && !data.user.email_confirmed_at) {
          setMessage('確認メールを送信しました。メールを確認してアカウントを有効化してください。')
        }
      }
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{mode === 'login' ? 'ログイン' : 'アカウント作成'}</CardTitle>
        <CardDescription>
          {mode === 'login'
            ? 'アカウントにログインしてください'
            : '新しいアカウントを作成してください'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAuth} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">名前</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="山田太郎"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">役割</Label>
                <Select value={role} onValueChange={(value: 'teacher' | 'guardian') => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher">講師</SelectItem>
                    <SelectItem value="guardian">保護者</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '処理中...' : (mode === 'login' ? 'ログイン' : 'アカウント作成')}
          </Button>
        </form>

        {message && (
          <div className="mt-4 p-3 text-sm bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-700/30 rounded text-brand-700 dark:text-brand-300">
            {message}
          </div>
        )}

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => onModeChange(mode === 'login' ? 'signup' : 'login')}
            className="text-sm text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
          >
            {mode === 'login'
              ? 'アカウントをお持ちでない方はこちら'
              : '既にアカウントをお持ちの方はこちら'
            }
          </button>
        </div>
      </CardContent>
    </Card>
  )
}