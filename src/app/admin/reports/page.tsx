import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminReportsPlaceholderPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardHeader>
                        <CardTitle>管理レポート - 近日公開予定</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">レポート出力機能は現在準備中です。</p>
                    </CardContent>
                </Card>
            </div>
        </ProtectedRoute>
    )
}
