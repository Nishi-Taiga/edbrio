'use client'

import { ProtectedRoute } from '@/components/layout/protected-route'
import { ContactForm } from '@/components/contact-form'
import { useAuth } from '@/hooks/use-auth'

export default function TeacherContactPage() {
  const { user, dbUser } = useAuth()

  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">お問い合わせ</h1>
          <p className="text-slate-500 dark:text-slate-400">ご質問・ご要望・不具合のご報告など、お気軽にお問い合わせください。</p>
        </div>
        <ContactForm
          defaultName={dbUser?.name || ''}
          defaultEmail={user?.email || ''}
        />
      </div>
    </ProtectedRoute>
  )
}
