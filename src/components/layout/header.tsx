'use client'

import { useEffect, useMemo, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/use-auth'
import { EdBrioLogo } from '@/components/ui/edbrio-logo'
import { useSidebar } from './sidebar-context'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { createClient } from '@/lib/supabase/client'
import type { TeacherPlan } from '@/lib/types/database'

interface HeaderProps {
  showMenuButton?: boolean
}

export function Header({ showMenuButton }: HeaderProps) {
  const { user, dbUser } = useAuth()
  const { toggleDesktop, toggleMobile } = useSidebar()
  const t = useTranslations('common')
  const supabase = useMemo(() => createClient(), [])
  const [plan, setPlan] = useState<TeacherPlan | null>(null)

  const homeHref = dbUser?.role === 'teacher' ? '/teacher/dashboard' : dbUser?.role === 'guardian' ? '/guardian/dashboard' : (dbUser?.role as string) === 'admin' ? '/admin/dashboard' : '/'

  useEffect(() => {
    if (dbUser?.role !== 'teacher' || !dbUser?.id) return
    supabase
      .from('teachers')
      .select('plan')
      .eq('id', dbUser.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setPlan(data.plan as TeacherPlan)
      })
  }, [dbUser?.id, dbUser?.role, supabase])

  const handleMenuClick = () => {
    if (window.innerWidth < 1024) {
      toggleMobile()
    } else {
      toggleDesktop()
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 border-border-semantic backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {showMenuButton && (
            <Button variant="ghost" size="sm" onClick={handleMenuClick}>
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <Link href={homeHref} className="flex items-center gap-2 group">
            <EdBrioLogo size={24} className="shrink-0" />
            <span className="text-2xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400 group-hover:opacity-90">EdBrio</span>
          </Link>
          {plan && (
            <span className={
              plan === 'standard'
                ? 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300'
                : 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
            }>
              {plan === 'standard' ? 'Standard' : 'Free'}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {!user && (
            <>
              <LanguageSwitcher />
              <div className="flex space-x-2">
                <Link href="/login">
                  <Button variant="outline" size="sm">{t('login')}</Button>
                </Link>
                <Link href={{ pathname: '/login', query: { mode: 'signup' } }}>
                  <Button size="sm">{t('freeRegister')}</Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
