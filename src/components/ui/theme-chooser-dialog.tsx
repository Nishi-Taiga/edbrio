'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Moon, Sun, Monitor } from 'lucide-react'

const THEME_CHOSEN_KEY = 'edbrio-theme-chosen'

export function ThemeChooserDialog() {
  const { setTheme } = useTheme()
  const [show, setShow] = useState(false)
  const pathname = usePathname()

  // Only show on authenticated dashboard pages
  const isDashboard = pathname?.startsWith('/teacher') || pathname?.startsWith('/guardian') || pathname?.startsWith('/admin')

  useEffect(() => {
    if (isDashboard && !localStorage.getItem(THEME_CHOSEN_KEY)) {
      setShow(true)
    }
  }, [isDashboard])

  if (!show) return null

  const choose = (t: string) => {
    setTheme(t)
    localStorage.setItem(THEME_CHOSEN_KEY, '1')
    setShow(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border-semantic rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
        <h2 className="text-xl font-bold mb-2">テーマを選択</h2>
        <p className="text-sm text-muted-foreground mb-6">お好みの表示モードを選んでください。あとから設定画面で変更できます。</p>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => choose('light')}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border-semantic hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition cursor-pointer"
          >
            <Sun className="w-7 h-7 text-amber-500" />
            <span className="text-sm font-semibold">ライト</span>
          </button>
          <button
            onClick={() => choose('dark')}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border-semantic hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition cursor-pointer"
          >
            <Moon className="w-7 h-7 text-brand-500" />
            <span className="text-sm font-semibold">ダーク</span>
          </button>
          <button
            onClick={() => choose('system')}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border-semantic hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition cursor-pointer"
          >
            <Monitor className="w-7 h-7 text-slate-500" />
            <span className="text-sm font-semibold">自動</span>
          </button>
        </div>
      </div>
    </div>
  )
}
