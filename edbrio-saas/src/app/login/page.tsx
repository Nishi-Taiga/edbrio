'use client'

import { useState } from 'react'
import { AuthForm } from '@/components/auth/auth-form'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <AuthForm mode={mode} onModeChange={setMode} />
    </div>
  )
}

