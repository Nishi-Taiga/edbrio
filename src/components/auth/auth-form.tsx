'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { trackEvent } from '@/lib/analytics'

function redirectByRole(router: ReturnType<typeof useRouter>, role: string) {
  const path = role === 'guardian'
    ? '/guardian/dashboard'
    : role === 'admin'
      ? '/admin/dashboard'
      : '/teacher/dashboard'
  router.replace(path)
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.166 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}

interface AuthFormProps {
  mode: 'login' | 'signup'
  onModeChange: (mode: 'login' | 'signup') => void
  inviteToken?: string
  lockedRole?: 'guardian'
  prefillEmail?: string
  onSignupComplete?: () => void
}

export function AuthForm({ mode, onModeChange, inviteToken, lockedRole, prefillEmail, onSignupComplete }: AuthFormProps) {
  const router = useRouter()
  const { user, dbUser } = useAuth()
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const [email, setEmail] = useState(prefillEmail || '')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'teacher' | 'guardian'>(lockedRole || 'teacher')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState('')

  const supabase = useMemo(() => createClient(), [])

  // Sync prefillEmail changes
  useEffect(() => {
    if (prefillEmail) setEmail(prefillEmail)
  }, [prefillEmail])

  // Sync lockedRole changes
  useEffect(() => {
    if (lockedRole) setRole(lockedRole)
  }, [lockedRole])

  // Prefetch dashboard routes for faster transitions
  useEffect(() => {
    router.prefetch('/teacher/dashboard')
    router.prefetch('/guardian/dashboard')
    router.prefetch('/admin/dashboard')
  }, [router])

  // Redirect if already logged in (only when not in invite flow)
  useEffect(() => {
    if (user && !inviteToken) {
      const userRole = dbUser?.role || user.user_metadata?.role || 'teacher'
      redirectByRole(router, userRole)
    }
  }, [user, dbUser, router, inviteToken])

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setMessage('')

    try {
      // Build callback URL with role and invite info
      const callbackUrl = new URL('/api/auth/callback', window.location.origin)

      // In signup mode, pass the selected role so callback can provision correctly
      if (mode === 'signup') {
        callbackUrl.searchParams.set('role', lockedRole || role)
      }

      if (inviteToken) {
        callbackUrl.searchParams.set('inviteToken', inviteToken)
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
        },
      })

      if (error) throw error
    } catch (error: any) {
      setMessage(error.message)
      setGoogleLoading(false)
    }
  }

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

        // If in invite flow, call onSignupComplete instead of redirecting
        if (inviteToken && onSignupComplete) {
          onSignupComplete()
          return
        }

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

        trackEvent({ name: 'sign_up', params: { method: 'email', role } })

        if (data.user && !data.user.email_confirmed_at) {
          setMessage(t('confirmationEmailSent'))
        } else if (data.user && onSignupComplete) {
          // Email confirmation disabled or auto-confirmed — proceed with invite
          onSignupComplete()
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
        {/* Role selector for signup mode (shown above Google button) */}
        {mode === 'signup' && !lockedRole && (
          <div className="space-y-2 mb-4">
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
        )}

        {/* Google sign-in button */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
        >
          {googleLoading ? (
            tCommon('processing')
          ) : (
            <>
              <GoogleIcon />
              <span className="ml-2">{t('googleSignIn')}</span>
            </>
          )}
        </Button>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              {t('orDivider')}
            </span>
          </div>
        </div>

        <form onSubmit={handleAuth} noValidate className="space-y-4">
          {mode === 'signup' && (
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
            {mode === 'login' && (
              <div className="text-right">
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-brand-600 dark:hover:text-brand-400 hover:underline"
                >
                  {t('forgotPasswordLink')}
                </Link>
              </div>
            )}
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
