'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EdBrioLogo } from '@/components/ui/edbrio-logo'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const supabase = useMemo(() => createClient(), [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const appUrl = window.location.origin
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/api/auth/callback?next=/reset-password`,
      })

      if (resetError) throw resetError
      setSent(true)
    } catch {
      setError(t('loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2.5 mb-8">
        <EdBrioLogo size={40} />
        <span className="text-3xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400">EdBrio</span>
      </div>

      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{t('forgotPassword.title')}</CardTitle>
          <CardDescription>{t('forgotPassword.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <div className="p-3 text-sm bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-700/30 rounded text-brand-700 dark:text-brand-300">
                {t('forgotPassword.emailSent')}
              </div>
              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
                >
                  {t('forgotPassword.backToLogin')}
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? tCommon('processing') : t('forgotPassword.submitButton')}
              </Button>

              {error && (
                <div className="p-3 text-sm bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/30 rounded text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
                >
                  {t('forgotPassword.backToLogin')}
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
