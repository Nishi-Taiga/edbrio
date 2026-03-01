'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/use-auth'
import { AuthForm } from '@/components/auth/auth-form'
import { EdBrioLogo } from '@/components/ui/edbrio-logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

interface InviteInfo {
  valid: boolean
  reason?: string
  teacherName?: string
  email?: string
  method?: 'email' | 'qr'
}

export default function InvitePage() {
  const params = useParams()
  const token = params.token as string
  const router = useRouter()
  const t = useTranslations('invite')
  const { user, dbUser, loading: authLoading } = useAuth()

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')

  // Validate token on mount
  useEffect(() => {
    async function validate() {
      try {
        const res = await fetch(`/api/invites/validate?token=${encodeURIComponent(token)}`)
        const data = await res.json()
        setInviteInfo(data)
      } catch {
        setInviteInfo({ valid: false, reason: 'error' })
      } finally {
        setLoading(false)
      }
    }
    validate()
  }, [token])

  const acceptInvite = useCallback(async () => {
    setAccepting(true)
    setError(null)
    try {
      const res = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || t('acceptError'))
        return
      }
      setAccepted(true)
      setTimeout(() => router.replace('/guardian/dashboard'), 2000)
    } catch {
      setError(t('acceptError'))
    } finally {
      setAccepting(false)
    }
  }, [token, router, t])

  // Auto-accept when user logs in via invite flow
  const handleSignupComplete = useCallback(() => {
    acceptInvite()
  }, [acceptInvite])

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    )
  }

  // Invalid token states
  if (!inviteInfo?.valid) {
    const reasonMessage = inviteInfo?.reason === 'expired'
      ? t('expiredToken')
      : inviteInfo?.reason === 'used'
        ? t('usedToken')
        : t('invalidToken')

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface py-12 px-4">
        <div className="flex items-center gap-2.5 mb-8">
          <EdBrioLogo size={40} />
          <span className="text-3xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400">EdBrio</span>
        </div>
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <p className="text-gray-700 dark:text-gray-300">{reasonMessage}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Successfully accepted
  if (accepted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface py-12 px-4">
        <div className="flex items-center gap-2.5 mb-8">
          <EdBrioLogo size={40} />
          <span className="text-3xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400">EdBrio</span>
        </div>
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <p className="text-gray-700 dark:text-gray-300">{t('acceptSuccess')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Logged in as guardian — show accept button
  if (user && dbUser?.role === 'guardian') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface py-12 px-4">
        <div className="flex items-center gap-2.5 mb-8">
          <EdBrioLogo size={40} />
          <span className="text-3xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400">EdBrio</span>
        </div>
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>{t('acceptTitle')}</CardTitle>
            <CardDescription>
              {t('acceptDescription', {
                teacherName: inviteInfo.teacherName,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 text-sm bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/30 rounded text-red-700 dark:text-red-300">
                {error}
              </div>
            )}
            <Button className="w-full" onClick={acceptInvite} disabled={accepting}>
              {accepting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {t('acceptButton')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Logged in as teacher — show error
  if (user && dbUser?.role === 'teacher') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface py-12 px-4">
        <div className="flex items-center gap-2.5 mb-8">
          <EdBrioLogo size={40} />
          <span className="text-3xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400">EdBrio</span>
        </div>
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="w-12 h-12 text-amber-500" />
              <p className="text-gray-700 dark:text-gray-300">{t('wrongRole')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Not logged in — show auth form with invite context
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface py-12 px-4">
      <div className="flex items-center gap-2.5 mb-8">
        <EdBrioLogo size={40} />
        <span className="text-3xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400">EdBrio</span>
      </div>

      <Card className="w-full max-w-md mx-auto mb-6">
        <CardContent className="pt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {t('acceptDescription', {
              teacherName: inviteInfo.teacherName,
            })}
          </p>
        </CardContent>
      </Card>

      <AuthForm
        mode={authMode}
        onModeChange={setAuthMode}
        inviteToken={token}
        lockedRole="guardian"
        prefillEmail={inviteInfo.email || ''}
        onSignupComplete={handleSignupComplete}
      />
    </div>
  )
}
