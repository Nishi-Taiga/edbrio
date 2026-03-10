'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, usePathname } from '@/i18n/navigation'
import { Menu, Bell, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/use-auth'
import { EdBrioLogo } from '@/components/ui/edbrio-logo'
import { useSidebar } from './sidebar-context'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import type { TeacherPlan } from '@/lib/types/database'

interface Announcement {
  id: string
  title: string
  content: string
  created_at: string
  is_read: boolean
}

interface HeaderProps {
  showMenuButton?: boolean
}

export function Header({ showMenuButton }: HeaderProps) {
  const { user, dbUser, loading: authLoading } = useAuth()
  const { toggleDesktop, toggleMobile } = useSidebar()
  const t = useTranslations('common')
  const pathname = usePathname()
  const supabase = useMemo(() => createClient(), [])
  const [plan, setPlan] = useState<TeacherPlan | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)

  // Notification state
  const [notifOpen, setNotifOpen] = useState(false)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [notifLoaded, setNotifLoaded] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

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

  // Fetch announcements
  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch('/api/announcements')
      if (res.ok) {
        const data = await res.json()
        setAnnouncements(data.announcements || [])
        setNotifLoaded(true)
      }
    } catch { /* non-critical */ }
  }, [])

  useEffect(() => {
    if (user) fetchAnnouncements()
  }, [user, fetchAnnouncements])

  // Close on outside click
  useEffect(() => {
    if (!notifOpen) return
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [notifOpen])

  // Mark announcement as read
  const markRead = async (id: string) => {
    try {
      await fetch('/api/announcements/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcement_id: id }),
      })
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a))
    } catch { /* non-critical */ }
  }

  const unreadCount = announcements.filter(a => !a.is_read).length

  const handleMenuClick = () => {
    if (window.innerWidth < 768) {
      toggleMobile()
    } else {
      toggleDesktop()
    }
  }

  const handleBellClick = () => {
    setNotifOpen(prev => !prev)
  }

  // Use solid dark purple header for dashboard routes (path-based to avoid flash during auth loading)
  const isDashboard = pathname?.startsWith('/teacher') || pathname?.startsWith('/guardian')

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

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
          {authLoading ? (
            /* Placeholder matching bell+avatar size to prevent layout shift */
            <div className="flex items-center gap-4">
              <div className="w-[22px] h-[22px] rounded-full" />
              <div className="w-8 h-8 rounded-full" />
            </div>
          ) : user ? (
            <>
              {/* Notification bell with dropdown */}
              <div className="relative" ref={notifRef}>
                <button onClick={handleBellClick} className="relative p-1">
                  <Bell className="w-[22px] h-[22px] text-[#D4BEE4] dark:text-[#6D5A8A] cursor-pointer hover:opacity-80 transition-opacity" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-slate-200 dark:border-[#2E2840] bg-white dark:bg-[#1E1A2B] shadow-xl z-50">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-[#2E2840]">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('notifications')}</h3>
                    </div>
                    {!notifLoaded ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-400">...</div>
                    ) : announcements.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                        {t('noNotifications')}
                      </div>
                    ) : (
                      <div>
                        {announcements.map((a) => (
                          <button
                            key={a.id}
                            className={`w-full text-left px-4 py-3 border-b border-slate-50 dark:border-[#2E2840]/50 hover:bg-slate-50 dark:hover:bg-[#282237] transition-colors ${
                              !a.is_read ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''
                            }`}
                            onClick={() => { if (!a.is_read) markRead(a.id) }}
                          >
                            <div className="flex items-start gap-2.5">
                              <Megaphone className={`w-4 h-4 mt-0.5 shrink-0 ${!a.is_read ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-medium truncate ${!a.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                    {a.title}
                                  </span>
                                  {!a.is_read && (
                                    <span className="w-2 h-2 rounded-full bg-brand-600 dark:bg-brand-400 shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{a.content}</p>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">{formatDate(a.created_at)}</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
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
