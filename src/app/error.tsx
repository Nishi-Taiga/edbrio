'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          エラーが発生しました
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          ページの表示中にエラーが発生しました。もう一度お試しください。
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            ホームに戻る
          </Button>
          <Button onClick={reset}>
            もう一度試す
          </Button>
        </div>
      </div>
    </div>
  )
}
