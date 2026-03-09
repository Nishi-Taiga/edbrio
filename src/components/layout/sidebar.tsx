'use client'

import { useEffect, useMemo, useState } from 'react'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/use-auth'
import { useUnreadCount } from '@/hooks/use-unread-count'
import { useBookingReports } from '@/hooks/use-booking-reports'
import { createClient } from '@/lib/supabase/client'
import {
  ChevronUp, LogOut, Mail, Settings, X, BookOpen,
  LayoutDashboard, FileText, Calendar, MessageSquare, GraduationCap, Ticket,
  Home, CalendarPlus, CalendarCheck,
  type LucideIcon,
} from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(' ')
}

interface SidebarProps {
  mobile?: boolean
  collapsed?: boolean
  onClose?: () => void
}

export function Sidebar({ mobile, collapsed, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isGuardian = pathname?.startsWith('/guardian')
  const { user, dbUser, signOut } = useAuth()
  const t = useTranslations('sidebar')
  const role = isGuardian ? 'guardian' as const : 'teacher' as const
  const { count: unreadCount } = useUnreadCount(user?.id, role)
  const { pendingCount: pendingReportCount } = useBookingReports(
    !isGuardian ? user?.id : undefined,
    'teacher'
  )

  // Fetch profile display_name for teachers
  const supabase = useMemo(() => createClient(), [])
  const [displayName, setDisplayName] = useState<string | null>(null)
  useEffect(() => {
    if (!user?.id || !dbUser?.role) return
    if (dbUser.role === 'teacher') {
      supabase
        .from('teachers')
        .select('public_profile')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          const dn = (data?.public_profile as Record<string, any>)?.display_name
          if (dn) setDisplayName(dn)
        })
    }
  }, [user?.id, dbUser?.role, supabase])

  const shownName = displayName || dbUser?.name || user?.email || ''
  const nameInitial = shownName[0]?.toUpperCase() || '?'

  const guardianItems: { href: string; label: string; icon: LucideIcon; badge?: number }[] = [
    { href: '/guardian/dashboard', label: t('guardian.home'), icon: Home },
    { href: '/guardian/booking', label: t('guardian.booking'), icon: CalendarPlus },
    { href: '/guardian/tickets', label: t('guardian.tickets'), icon: Ticket },
    { href: '/guardian/bookings', label: t('guardian.bookings'), icon: CalendarCheck },
    { href: '/guardian/reports', label: t('guardian.reports'), icon: FileText },
    { href: '/guardian/curriculum', label: t('guardian.curriculum'), icon: BookOpen },
    { href: '/guardian/chat', label: t('guardian.chat'), icon: MessageSquare, badge: unreadCount },
    { href: '/guardian/settings', label: t('guardian.settings'), icon: Settings },
  ]

  const teacherItems: { href: string; label: string; icon: LucideIcon; badge?: number }[] = [
    { href: '/teacher/dashboard', label: t('teacher.dashboard'), icon: LayoutDashboard },
    { href: '/teacher/reports', label: t('teacher.reports'), icon: FileText },
    { href: '/teacher/calendar', label: t('teacher.calendar'), icon: Calendar, badge: pendingReportCount },
    { href: '/teacher/chat', label: t('teacher.chat'), icon: MessageSquare, badge: unreadCount },
    { href: '/teacher/curriculum', label: t('teacher.students'), icon: GraduationCap },
    { href: '/teacher/tickets', label: t('teacher.tickets'), icon: Ticket },
  ]

  const items = isGuardian ? guardianItems : teacherItems

  const profilePath = isGuardian ? '/guardian/settings' : '/teacher/profile'
  const contactPath = isGuardian ? '/guardian/contact' : '/teacher/contact'

  return (
    <nav className={classNames('h-full', collapsed ? 'p-2' : 'p-4')}>
      <div className="h-full flex flex-col">
        {mobile && (
          <div className="flex justify-end mb-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}
        <ul className="space-y-1 flex-1">
          {items.map((it) => {
            const active = pathname === it.href || (it.href !== '/teacher/dashboard' && it.href !== '/guardian/dashboard' && pathname?.startsWith(it.href))
            const Icon = it.icon
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  onClick={() => {
                    onClose?.()
                  }}
                  title={collapsed ? it.label : undefined}
                  className={classNames(
                    'flex items-center rounded-[10px] text-sm transition-colors relative',
                    collapsed ? 'justify-center p-2' : 'justify-between px-3 py-2.5',
                    active
                      ? 'bg-[#3D2B5E] text-white font-semibold dark:bg-[#1A1726] dark:text-white'
                      : 'text-[#9B8AB5] hover:bg-[#3D2B5E]/30 dark:text-[#6D5A8A] dark:hover:bg-[#1A1726]/50'
                  )}
                >
                  {collapsed ? (
                    <>
                      <Icon className={classNames('w-5 h-5', active ? 'text-[#D4BEE4] dark:text-[#6D5A8A]' : '')} />
                      {it.badge ? (
                        <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-brand-600 text-white text-[9px] flex items-center justify-center">
                          {it.badge}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon className={classNames('w-5 h-5 shrink-0', active ? 'text-[#D4BEE4] dark:text-[#6D5A8A]' : '')} />
                        <span>{it.label}</span>
                      </div>
                      {it.badge ? (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center">
                          {it.badge}
                        </Badge>
                      ) : null}
                    </>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* User menu */}
        {user && (
          <div className={classNames('mt-4 border-t border-[#3D2B5E] dark:border-[#1A1726] pt-3', collapsed && 'flex justify-center')}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {collapsed ? (
                  <button
                    title={shownName}
                    className="flex items-center justify-center rounded-[10px] p-2 text-sm text-[#9B8AB5] hover:bg-[#3D2B5E]/30 dark:text-[#6D5A8A] dark:hover:bg-[#1A1726]/50 transition-colors"
                  >
                    <Avatar className="w-8 h-8 shrink-0">
                      {dbUser?.avatar_url && <AvatarImage src={dbUser.avatar_url} alt="" />}
                      <AvatarFallback className="text-[10px] bg-gradient-to-b from-[#7C3AED] to-[#D4BEE4] dark:from-[#A78BFA] dark:to-[#6D5A8A] text-white">
                        {nameInitial}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                ) : (
                  <button className="flex w-full items-center justify-between rounded-[10px] px-3 py-2.5 text-sm text-white hover:bg-[#3D2B5E]/30 dark:hover:bg-[#1A1726]/50 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="w-8 h-8 shrink-0">
                        {dbUser?.avatar_url && <AvatarImage src={dbUser.avatar_url} alt="" />}
                        <AvatarFallback className="text-[10px] bg-gradient-to-b from-[#7C3AED] to-[#D4BEE4] dark:from-[#A78BFA] dark:to-[#6D5A8A] text-white">
                          {nameInitial}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold truncate">{shownName}</span>
                    </div>
                    <ChevronUp className="w-4 h-4 shrink-0 text-[#9B8AB5] dark:text-[#6D5A8A]" />
                  </button>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align={collapsed ? 'center' : 'start'} className="w-48">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => { onClose?.(); router.push(profilePath) }}
                >
                  <Settings className="w-4 h-4" />
                  {t('userMenu.settings')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => { onClose?.(); router.push(contactPath) }}
                >
                  <Mail className="w-4 h-4" />
                  {t('userMenu.contact')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  variant="destructive"
                  onClick={signOut}
                >
                  <LogOut className="w-4 h-4" />
                  {t('userMenu.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </nav>
  )
}
