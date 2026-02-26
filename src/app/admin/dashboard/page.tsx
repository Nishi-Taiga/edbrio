import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Admin routes are protected by Basic Auth in middleware — no Supabase auth needed
export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>管理者ダッシュボード</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">この機能は現在開発中です。しばらくお待ちください。</p>
        </CardContent>
      </Card>
    </div>
  )
}
