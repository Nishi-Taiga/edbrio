'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function redirectByRole(router: ReturnType<typeof useRouter>, role: string) {
  const path = role === 'guardian'
    ? '/guardian/dashboard'
    : role === 'admin'
      ? '/admin/dashboard'
      : '/teacher/dashboard'
  router.replace(path)
}

export function AuthForm({ mode, onModeChange }: {
  mode: 'login' | 'signup',
  onModeChange: (mode: 'login' | 'signup') => void
}) {
  const router = useRouter()
  const { user, dbUser } = useAuth()
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'teacher' | 'guardian'>('teacher')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const supabase = useMemo(() => createClient(), [])

  // Prefetch dashboard routes for faster transitions
  useEffect(() => {
    router.prefetch('/teacher/dashboard')
    router.prefetch('/guardian/dashboard')
    router.prefetch('/admin/dashboard')
  }, [router])

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const userRole = dbUser?.role || user.user_metadata?.role || 'teacher'
      redirectByRole(router, userRole)
    }
  }, [user, dbUser, router])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (mode === 'login') {
        // Server-side login with account lockout protection
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const result = await res.json()
        if (!res.ok) {
          setMessage(result.error || t('loginFailed'))
          return
        }
        // Server validated credentials — now set client session
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        // Redirect immediately using the role from the API response
        redirectByRole(router, result.role)
        return
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
          setMessage(t('confirmationEmailSent'))
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
        <CardTitle>{mode === 'login' ? t('loginTitle') : t('signupTitle')}</CardTitle>
        <CardDescription>
          {mode === 'login'
            ? t('loginDescription')
            : t('signupDescription')
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAuth} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">{t('nameLabel')}</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t('namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">{t('roleLabel')}</Label>
                <Select value={role} onValueChange={(value: 'teacher' | 'guardian') => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher">{t('roleTeacher')}</SelectItem>
                    <SelectItem value="guardian">{t('roleGuardian')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">{t('emailLabel')}</Label>
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
            <Label htmlFor="password">{t('passwordLabel')}</Label>
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
            {loading ? tCommon('processing') : (mode === 'login' ? t('loginButton') : t('signupButton'))}
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
              ? t('noAccountLink')
              : t('hasAccountLink')
            }
          </button>
        </div>
      </CardContent>
    </Card>
  )
}