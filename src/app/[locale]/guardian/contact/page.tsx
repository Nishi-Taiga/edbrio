'use client'

import { ProtectedRoute } from '@/components/layout/protected-route'
import { ContactForm } from '@/components/contact-form'
import { useAuth } from '@/hooks/use-auth'
import { useTranslations } from 'next-intl'

export default function GuardianContactPage() {
  const t = useTranslations('guardianContact')
  const { user, dbUser } = useAuth()

  return (
    <ProtectedRoute allowedRoles={['guardian']}>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('title')}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t('description')}</p>
        </div>
        <ContactForm
          defaultName={dbUser?.name || ''}
          defaultEmail={user?.email || ''}
        />
      </div>
    </ProtectedRoute>
  )
}
