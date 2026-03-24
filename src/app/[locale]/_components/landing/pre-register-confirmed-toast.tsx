'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

export function PreRegisterConfirmedToast() {
  const searchParams = useSearchParams()
  const t = useTranslations('landing.preRegister')
  const confirmed = searchParams.get('confirmed')

  useEffect(() => {
    if (confirmed === 'true') {
      toast.success(t('confirmedToast'))
    } else if (confirmed === 'error') {
      toast.error(t('confirmedErrorToast'))
    }
  }, [confirmed, t])

  return null
}
