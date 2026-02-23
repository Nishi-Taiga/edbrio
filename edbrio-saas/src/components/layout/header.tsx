'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { User, LogOut } from 'lucide-react'
import { EdBrioLogo } from '@/components/ui/edbrio-logo'

export function Header() {
  const { user, dbUser, signOut } = useAuth()

  const roleLabel = dbUser?.role === 'teacher' ? '講師' : dbUser?.role === 'guardian' ? '保護者' : ''

  const homeHref = dbUser?.role === 'teacher' ? '/teacher/dashboard' : dbUser?.role === 'guardian' ? '/guardian/dashboard' : '/'

  return (
    <header className="border-b bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 dark:border-gray-800">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href={homeHref} className="flex items-center gap-2 group">
            <EdBrioLogo size={24} className="shrink-0" />
            <span className="text-2xl font-extrabold tracking-tight text-[#6f3ff5] group-hover:opacity-90">EdBrio</span>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <></>
          ) : (
            <div className="flex space-x-2">
              <Link href="/login">
                <Button variant="outline" size="sm" className="dark:border-gray-700 dark:text-gray-200">
                  ログイン
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm" className="dark:bg-blue-600 dark:text-white">
                  無料登録
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
