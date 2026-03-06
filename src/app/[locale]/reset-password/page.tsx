'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'
import { useRouter, Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EdBrioLogo } from '@/components/ui/edbrio-logo'

export default function ResetPasswordPage() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setHasSession(false)
      } else {
        setHasSession(true)
      }
    })
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError(t('resetPassword.passwordMismatch'))
      return
    }

    if (password.length < 8) {
      setError(t('resetPassword.passwordTooShort'))
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) throw updateError

      setMessage(t('resetPassword.success'))
      setTimeout(() => {
        router.replace('/login')
      }, 2000)
    } catch {
      setError(t('loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  if (hasSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <p className="text-muted-foreground">{tCommon('loading')}</p>
      </div>
    )
  }

  if (hasSession === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5 mb-8">
          <EdBrioLogo size={40} />
          <span className="text-3xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400">EdBrio</span>
        </div>
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {t('resetPassword.noSession')}
              </p>
              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
                >
                  {t('forgotPassword.submitButton')}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2.5 mb-8">
        <EdBrioLogo size={40} />
        <span className="text-3xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400">EdBrio</span>
      </div>

      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{t('resetPassword.title')}</CardTitle>
          <CardDescription>{t('resetPassword.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t('resetPassword.newPasswordLabel')}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('resetPassword.confirmPasswordLabel')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? tCommon('processing') : t('resetPassword.submitButton')}
            </Button>

            {error && (
              <div className="p-3 text-sm bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/30 rounded text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {message && (
              <div className="p-3 text-sm bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-700/30 rounded text-brand-700 dark:text-brand-300">
                {message}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
