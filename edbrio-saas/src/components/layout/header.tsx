'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { User, LogOut } from 'lucide-react'

export function Header() {
  const { user, dbUser, signOut } = useAuth()

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            EdBrio
          </Link>
          <span className="text-sm text-gray-500">家庭教師マッチング</span>
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span className="text-sm">{dbUser?.name || user.email}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {dbUser?.role === 'teacher' ? '講師' : '保護者'}
                </span>
              </div>
              
              {dbUser?.role === 'teacher' && (
                <Link href="/teacher/dashboard">
                  <Button variant="outline" size="sm">
                    ダッシュボード
                  </Button>
                </Link>
              )}
              
              {dbUser?.role === 'guardian' && (
                <Link href="/guardian/home">
                  <Button variant="outline" size="sm">
                    ホーム
                  </Button>
                </Link>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={signOut}
                className="text-gray-600"
              >
                <LogOut className="w-4 h-4" />
                ログアウト
              </Button>
            </>
          ) : (
            <div className="flex space-x-2">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  ログイン
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm">
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
