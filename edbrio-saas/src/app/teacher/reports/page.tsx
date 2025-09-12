'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, Plus, Edit, Eye, Send, Clock, User, BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Student {
  id: string
  name: string
  grade: string
}

interface Booking {
  id: string
  student: Student
  subject: string
  date: Date
  startTime: string
  endTime: string
  status: 'done' | 'confirmed' | 'canceled'
}

interface Report {
  id: string
  bookingId: string
  booking: Booking
  contentRaw: string
  contentPublic: string
  aiSummary?: string
  visibility: 'private' | 'public'
  publishedAt?: string
  createdAt: string
  status: 'draft' | 'published' | 'pending'
}

export default function TeacherReports() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingReport, setEditingReport] = useState<Report | null>(null)
  const [reportForm, setReportForm] = useState({
    contentRaw: '',
    contentPublic: '',
    visibility: 'public' as 'private' | 'public',
  })

  // Mock data
  const students: Student[] = [
    { id: '1', name: '田中花子', grade: '高校2年' },
    { id: '2', name: '佐藤太郎', grade: '中学3年' },
    { id: '3', name: '鈴木美咲', grade: '高校1年' },
  ]

  const completedBookings: Booking[] = [
    {
      id: '1',
      student: students[0],
      subject: '数学',
      date: new Date(2024, 8, 10),
      startTime: '14:00',
      endTime: '15:00',
      status: 'done',
    },
    {
      id: '2',
      student: students[1],
      subject: '英語',
      date: new Date(2024, 8, 11),
      startTime: '16:00',
      endTime: '17:00',
      status: 'done',
    },
    {
      id: '3',
      student: students[2],
      subject: '国語',
      date: new Date(2024, 8, 12),
      startTime: '10:00',
      endTime: '11:00',
      status: 'done',
    },
  ]

  const reports: Report[] = [
    {
      id: '1',
      bookingId: '1',
      booking: completedBookings[0],
      contentRaw: '今日は二次関数の応用問題を中心に学習しました。グラフの性質について理解が深まったようです。次回は判別式について学習予定です。',
      contentPublic: '二次関数の応用問題に取り組み、グラフの性質について学習しました。理解度も高く、順調に進んでいます。',
      aiSummary: '二次関数の応用問題を学習。グラフの性質を理解。次回は判別式を予定。',
      visibility: 'public',
      publishedAt: '2024-09-10T15:30:00',
      createdAt: '2024-09-10T15:00:00',
      status: 'published',
    },
    {
      id: '2',
      bookingId: '2',
      booking: completedBookings[1],
      contentRaw: '英語の長文読解を行いました。語彙力の向上が必要です。',
      contentPublic: '英語長文読解の練習を行いました。継続的な学習で語彙力向上を目指します。',
      visibility: 'public',
      publishedAt: '2024-09-11T17:15:00',
      createdAt: '2024-09-11T17:00:00',
      status: 'published',
    },
  ]

  const bookingsWithoutReports = completedBookings.filter(
    booking => !reports.some(report => report.bookingId === booking.id)
  )

  const handleCreateReport = (booking: Booking) => {
    setSelectedBooking(booking)
    setReportForm({
      contentRaw: '',
      contentPublic: '',
      visibility: 'public',
    })
    setShowCreateDialog(true)
  }

  const handleEditReport = (report: Report) => {
    setEditingReport(report)
    setReportForm({
      contentRaw: report.contentRaw,
      contentPublic: report.contentPublic,
      visibility: report.visibility,
    })
    setShowCreateDialog(true)
  }

  const handleSaveReport = () => {
    if (editingReport) {
      // Update existing report
      console.log('Updating report:', editingReport.id, reportForm)
    } else if (selectedBooking) {
      // Create new report
      console.log('Creating report for booking:', selectedBooking.id, reportForm)
    }
    
    setShowCreateDialog(false)
    setSelectedBooking(null)
    setEditingReport(null)
    setReportForm({
      contentRaw: '',
      contentPublic: '',
      visibility: 'public',
    })
  }

  const generateAISummary = async () => {
    // In real app, call OpenAI API
    const mockSummary = reportForm.contentRaw.length > 50 
      ? reportForm.contentRaw.substring(0, 50) + '...'
      : reportForm.contentRaw
    
    setReportForm(prev => ({
      ...prev,
      contentPublic: mockSummary || prev.contentPublic
    }))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">公開済み</Badge>
      case 'draft':
        return <Badge variant="secondary">下書き</Badge>
      case 'pending':
        return <Badge variant="outline">承認待ち</Badge>
    }
  }

  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">授業レポート</h1>
          <p className="text-gray-600">授業の報告書を作成・管理しましょう</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            {/* Pending Reports */}
            {bookingsWithoutReports.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <Clock className="w-5 h-5" />
                    レポート未提出の授業
                  </CardTitle>
                  <CardDescription>
                    以下の授業のレポートがまだ作成されていません
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bookingsWithoutReports.map(booking => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border border-orange-200 bg-orange-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold">{booking.student.name}</span>
                            <Badge variant="outline">{booking.subject}</Badge>
                            <span className="text-sm text-gray-600">{booking.student.grade}</span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {format(booking.date, 'MM月dd日（EEE）', { locale: ja })} {booking.startTime} - {booking.endTime}
                          </div>
                        </div>
                        <Button onClick={() => handleCreateReport(booking)}>
                          <Plus className="w-4 h-4 mr-2" />
                          レポート作成
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reports List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  作成済みレポート
                </CardTitle>
                <CardDescription>過去に作成したレポートの一覧</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>生徒</TableHead>
                      <TableHead>科目</TableHead>
                      <TableHead>授業日</TableHead>
                      <TableHead>公開設定</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>作成日</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map(report => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{report.booking.student.name}</div>
                            <div className="text-sm text-gray-600">{report.booking.student.grade}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{report.booking.subject}</Badge>
                        </TableCell>
                        <TableCell>
                          {format(report.booking.date, 'MM/dd', { locale: ja })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={report.visibility === 'public' ? 'default' : 'secondary'}>
                            {report.visibility === 'public' ? '公開' : '非公開'}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell>
                          {format(new Date(report.createdAt), 'MM/dd HH:mm', { locale: ja })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditReport(report)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>レポート統計</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">総レポート数</span>
                    <span className="font-semibold">{reports.length}件</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">公開済み</span>
                    <span className="font-semibold text-green-600">
                      {reports.filter(r => r.status === 'published').length}件
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">未提出</span>
                    <span className="font-semibold text-orange-600">
                      {bookingsWithoutReports.length}件
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">今月の作成数</span>
                    <span className="font-semibold">{reports.length}件</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Writing Tips */}
            <Card>
              <CardHeader>
                <CardTitle>レポート作成のコツ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <strong>学習内容:</strong> 今日学習した具体的な内容を記載
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <strong>理解度:</strong> 生徒の理解度や反応を客観的に評価
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <strong>課題点:</strong> 改善が必要な点や宿題の提案
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <strong>次回予定:</strong> 次回の授業で扱う内容
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Assistant */}
            <Card>
              <CardHeader>
                <CardTitle>AI アシスタント</CardTitle>
                <CardDescription>レポート作成をサポート</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="text-sm text-blue-800">
                      <strong>Pro機能</strong><br/>
                      AIがレポートの要約や改善提案を行います
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    Pro版にアップグレード
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Templates */}
            <Card>
              <CardHeader>
                <CardTitle>テンプレート</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full text-left justify-start">
                  数学レポート
                </Button>
                <Button variant="outline" className="w-full text-left justify-start">
                  英語レポート
                </Button>
                <Button variant="outline" className="w-full text-left justify-start">
                  国語レポート
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Create/Edit Report Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {editingReport ? 'レポート編集' : 'レポート作成'}
              </DialogTitle>
              <DialogDescription>
                {selectedBooking && (
                  <>
                    {selectedBooking.student.name}さん - {selectedBooking.subject} - 
                    {format(selectedBooking.date, 'MM月dd日', { locale: ja })}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="content-raw">詳細レポート（講師用・非公開）</Label>
                <textarea
                  id="content-raw"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none h-32"
                  value={reportForm.contentRaw}
                  onChange={(e) => setReportForm(prev => ({ ...prev, contentRaw: e.target.value }))}
                  placeholder="授業の詳細な内容、生徒の反応、課題点、次回の予定など..."
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="border-t flex-1"></div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={generateAISummary}
                  disabled={!reportForm.contentRaw}
                >
                  <BookOpen className="w-4 h-4 mr-1" />
                  AI要約生成
                </Button>
                <div className="border-t flex-1"></div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content-public">公開レポート（保護者向け）</Label>
                <textarea
                  id="content-public"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none h-24"
                  value={reportForm.contentPublic}
                  onChange={(e) => setReportForm(prev => ({ ...prev, contentPublic: e.target.value }))}
                  placeholder="保護者に共有する内容（自動生成も可能）"
                />
              </div>

              <div className="space-y-2">
                <Label>公開設定</Label>
                <Select
                  value={reportForm.visibility}
                  onValueChange={(value: 'private' | 'public') => 
                    setReportForm(prev => ({ ...prev, visibility: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">保護者に公開</SelectItem>
                    <SelectItem value="private">非公開（講師のみ）</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                >
                  キャンセル
                </Button>
                <Button variant="outline">
                  下書き保存
                </Button>
                <Button onClick={handleSaveReport}>
                  {editingReport ? '更新' : '作成'} & 公開
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}