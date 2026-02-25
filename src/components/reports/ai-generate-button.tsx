'use client'

import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'

interface AiGenerateButtonProps {
  onClick: () => void
  loading: boolean
  disabled?: boolean
}

export function AiGenerateButton({ onClick, loading, disabled }: AiGenerateButtonProps) {
  return (
    <Button onClick={onClick} disabled={disabled || loading} className="bg-purple-600 hover:bg-purple-700 text-white">
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          AI生成中...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 mr-2" />
          AIで報告書を生成
        </>
      )}
    </Button>
  )
}
