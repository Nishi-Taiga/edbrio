'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { EdBrioLogo } from '@/components/ui/edbrio-logo'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function Header() {
  const { user, dbUser } = useAuth()

  const homeHref = dbUser?.role === 'teacher' ? '/teacher/dashboard' : dbUser?.role === 'guardian' ? '/guardian/dashboard' : '/'

  return (
    <header className="border-b bg-background border-border-semantic">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href={homeHref} className="flex items-center gap-2 group">
            <EdBrioLogo size={24} className="shrink-0" />
            <span className="text-2xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400 group-hover:opacity-90">EdBrio</span>
          </Link>
        </div>

        <div className="flex items-center space-x-3">
          <ThemeToggle />
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
