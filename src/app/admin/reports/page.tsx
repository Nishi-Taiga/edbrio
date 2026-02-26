import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminReportsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>管理レポート</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">レポート出力機能は現在準備中です。</p>
        </CardContent>
      </Card>
    </div>
  )
}
