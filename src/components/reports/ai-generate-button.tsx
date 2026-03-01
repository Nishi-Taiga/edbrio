'use client'

import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, Crown } from 'lucide-react'
import { Link } from '@/i18n/navigation'

interface AiGenerateButtonProps {
  onClick: () => void
  loading: boolean
  disabled?: boolean
  isPro?: boolean
  canGenerate?: boolean
  remainingGenerations?: number
  maxGenerations?: number
}

export function AiGenerateButton({
  onClick,
  loading,
  disabled,
  isPro = true,
  canGenerate = true,
  remainingGenerations,
  maxGenerations,
}: AiGenerateButtonProps) {
  if (!isPro) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 px-6 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <Crown className="w-4 h-4 text-amber-500" />
          AI報告書生成はスタンダードプランの機能です
        </div>
        <Link
          href="/teacher/profile"
          className="text-sm font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition"
        >
          プランをアップグレード →
        </Link>
      </div>
    )
  }

  const isLimitReached = !canGenerate

  return (
    <div className="flex flex-col items-center gap-1.5">
      <Button
        onClick={onClick}
        disabled={disabled || loading || isLimitReached}
        className="bg-purple-600 hover:bg-purple-700 text-white"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            AI生成中...
          </>
        ) : isLimitReached ? (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            生成上限に達しました
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            AIで報告書を生成
          </>
        )}
      </Button>
      {remainingGenerations != null && maxGenerations != null && (
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {isLimitReached
            ? `${maxGenerations}/${maxGenerations}回使用済み`
            : `残り${remainingGenerations}回`}
        </span>
      )}
    </div>
  )
}
