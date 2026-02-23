import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminUsersPlaceholderPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardHeader>
                        <CardTitle>ユーザー管理 - 近日公開予定</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">ユーザー管理機能は現在準備中です。</p>
                    </CardContent>
                </Card>
            </div>
        </ProtectedRoute>
    )
}
