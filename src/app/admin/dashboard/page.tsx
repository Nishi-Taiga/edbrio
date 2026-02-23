import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminPlaceholderPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>近日公開予定</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">この機能（管理画面）は現在開発中です。しばらくお待ちください。</p>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
