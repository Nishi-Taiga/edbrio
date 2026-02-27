'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { EdBrioLogo } from '@/components/ui/edbrio-logo'
import { useSidebar } from './sidebar-context'

interface HeaderProps {
  showMenuButton?: boolean
}

export function Header({ showMenuButton }: HeaderProps) {
  const { user, dbUser } = useAuth()
  const { toggleDesktop, toggleMobile } = useSidebar()

  const homeHref = dbUser?.role === 'teacher' ? '/teacher/dashboard' : dbUser?.role === 'guardian' ? '/guardian/dashboard' : '/'

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
        </div>

        <div className="flex items-center space-x-3">
          {user ? (
            <></>
          ) : (
            <div className="flex space-x-2">
              <Link href="/login">
                <Button variant="outline" size="sm">ログイン</Button>
              </Link>
              <Link href="/login">
                <Button size="sm">無料登録</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
