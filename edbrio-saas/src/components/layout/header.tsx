'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { User, LogOut } from 'lucide-react'

export function Header() {
  const { user, dbUser, signOut } = useAuth()

  const roleLabel = dbUser?.role === 'teacher' ? '講師' : dbUser?.role === 'guardian' ? '保護者' : ''

  return (
    <header className="border-b bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 dark:border-gray-800">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            EdBrio
          </Link>
          <span className="text-sm text-gray-500 dark:text-gray-400">家庭教師マッチング</span>
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span className="text-sm">{dbUser?.name || user.email}</span>
                {roleLabel && (
                  <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 px-2 py-1 rounded">
                    {roleLabel}
                  </span>
                )}
              </div>

              {dbUser?.role === 'teacher' && (
                <Link href="/teacher/dashboard">
                  <Button variant="outline" size="sm" className="dark:border-gray-700 dark:text-gray-200">
                    ダッシュボード
                  </Button>
                </Link>
              )}

              {dbUser?.role === 'guardian' && (
                <Link href="/guardian/home">
                  <Button variant="outline" size="sm" className="dark:border-gray-700 dark:text-gray-200">
                    ホーム
                  </Button>
                </Link>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-gray-600 dark:text-gray-300"
              >
                <LogOut className="w-4 h-4" />
                ログアウト
              </Button>
            </>
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

