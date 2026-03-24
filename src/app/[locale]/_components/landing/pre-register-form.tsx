'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Loader2, ArrowRight } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

interface PreRegisterFormProps {
  location: string
}

export function PreRegisterForm({ location }: PreRegisterFormProps) {
  const t = useTranslations('landing.preRegister')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setError('')

    try {
      const res = await fetch('/api/pre-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (res.status === 429) {
          throw new Error(t('errorRateLimit'))
        }
        throw new Error(data.error || t('errorGeneric'))
      }

      setStatus('sent')
      trackEvent({ name: 'pre_register', params: { location } })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('errorGeneric'))
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="flex flex-col items-start gap-2" data-testid="pre-register-success">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {t('successTitle')}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{t('successMessage')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3" data-testid="pre-register-form">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('placeholder')}
          className="h-10 flex-1 min-w-0 rounded-full border border-gray-950/10 bg-white px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-white/10 dark:bg-white/5"
          data-testid="pre-register-email"
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          data-testid="pre-register-submit"
        >
          {status === 'sending' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {t('submit')}
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>

      {status === 'error' && error && (
        <p className="text-sm text-red-600 dark:text-red-400" data-testid="pre-register-error">
          {error}
        </p>
      )}

      <p className="text-xs text-muted-foreground">{t('benefit')}</p>
    </div>
  )
}
