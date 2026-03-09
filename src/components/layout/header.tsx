'use client'

import { useEffect, useMemo, useState } from 'react'
import { Link, usePathname } from '@/i18n/navigation'
import { Menu, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/use-auth'
import { EdBrioLogo } from '@/components/ui/edbrio-logo'
import { useSidebar } from './sidebar-context'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import type { TeacherPlan } from '@/lib/types/database'

interface HeaderProps {
  showMenuButton?: boolean
}

export function Header({ showMenuButton }: HeaderProps) {
  const { user, dbUser } = useAuth()
  const { toggleDesktop, toggleMobile } = useSidebar()
  const t = useTranslations('common')
  const pathname = usePathname()
  const supabase = useMemo(() => createClient(), [])
  const [plan, setPlan] = useState<TeacherPlan | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)

  const homeHref = dbUser?.role === 'teacher' ? '/teacher/dashboard' : dbUser?.role === 'guardian' ? '/guardian/dashboard' : (dbUser?.role as string) === 'admin' ? '/admin/dashboard' : '/'
  const profileHref = pathname?.startsWith('/guardian') ? '/guardian/settings' : '/teacher/profile'

  useEffect(() => {
    if (dbUser?.role !== 'teacher' || !dbUser?.id) return
    supabase
      .from('teachers')
      .select('plan, public_profile')
      .eq('id', dbUser.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPlan(data.plan as TeacherPlan)
          const dn = (data.public_profile as Record<string, any>)?.display_name
          if (dn) setDisplayName(dn)
        }
      })
  }, [dbUser?.id, dbUser?.role, supabase])

  const handleMenuClick = () => {
    if (window.innerWidth < 768) {
      toggleMobile()
    } else {
      toggleDesktop()
    }
  }

  // Use solid dark purple header when authenticated (dashboard), transparent for public pages
  const isDashboard = !!user

  return (
    <header className={
      isDashboard
        ? 'sticky top-0 z-50 border-b border-[#3D2B5E] dark:border-[#1A1726] bg-[#2D1B4E] dark:bg-[#0F0D18]'
        : 'sticky top-0 z-50 border-b bg-background/95 border-border-semantic backdrop-blur supports-[backdrop-filter]:bg-background/60'
    }>
      <div className={isDashboard
        ? 'container mx-auto px-5 h-14 flex justify-between items-center'
        : 'container mx-auto px-4 py-4 flex justify-between items-center'
      }>
        <div className="flex items-center gap-3">
          {/* Hamburger menu: desktop/tablet only — hidden on mobile where bottom nav is used */}
          {showMenuButton && (
            <Button variant="ghost" size="sm" className={isDashboard
              ? 'hidden md:inline-flex text-[#D4BEE4] dark:text-[#6D5A8A] hover:bg-[#3D2B5E] dark:hover:bg-[#1A1726]'
              : 'hidden md:inline-flex'
            } onClick={handleMenuClick}>
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <Link href={homeHref} className="flex items-center gap-2 group">
            <EdBrioLogo size={24} className="shrink-0" />
            <span className={isDashboard
              ? 'text-xl font-extrabold text-white group-hover:opacity-90'
              : 'text-2xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400 group-hover:opacity-90'
            }>EdBrio</span>
          </Link>
          {plan && (
            <span className={isDashboard
              ? 'text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#3D2B5E] dark:bg-[#1A1726] text-[#D4BEE4] dark:text-[#6D5A8A]'
              : (plan === 'standard'
                ? 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300'
                : 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400')
            }>
              {plan === 'standard' ? 'Standard' : 'Free'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* Notification bell */}
              <Bell className="w-[22px] h-[22px] text-[#D4BEE4] dark:text-[#6D5A8A] cursor-pointer hover:opacity-80 transition-opacity" />
              {/* Profile avatar — links to profile/settings page */}
              <Link href={profileHref}>
                <Avatar className="w-8 h-8 cursor-pointer hover:opacity-90 transition-opacity">
                  {dbUser?.avatar_url && <AvatarImage src={dbUser.avatar_url} alt={displayName || dbUser?.name || ''} />}
                  <AvatarFallback className="text-sm bg-gradient-to-b from-[#7C3AED] to-[#D4BEE4] dark:from-[#A78BFA] dark:to-[#6D5A8A] text-white">
                    {(displayName || dbUser?.name || user.email)?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
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
