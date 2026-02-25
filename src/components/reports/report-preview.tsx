'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface ReportPreviewProps {
  content: string
  onChange: (content: string) => void
  onRegenerate: () => void
  regenerating: boolean
}

export function ReportPreview({ content, onChange, onRegenerate, regenerating }: ReportPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">保護者向け報告書（プレビュー）</CardTitle>
          <Button variant="outline" size="sm" onClick={onRegenerate} disabled={regenerating}>
            <RefreshCw className={`w-4 h-4 mr-1 ${regenerating ? 'animate-spin' : ''}`} />
            再生成
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <textarea
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[200px]"
          value={content}
          onChange={e => onChange(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-2">
          AIが生成した文章です。必要に応じて編集してから保存してください。
        </p>
      </CardContent>
    </Card>
  )
}
