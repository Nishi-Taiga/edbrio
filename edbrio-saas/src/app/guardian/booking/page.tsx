'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock, MapPin, User, CreditCard, Check } from 'lucide-react'
import { format, addDays, isSameDay, startOfWeek, addWeeks } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Teacher {
  id: string
  name: string
  handle: string
  subjects: string[]
  experience: string
  rating: number
  reviewCount: number
}

interface AvailableSlot {
  id: string
  teacherId: string
  teacher: Teacher
  date: Date
  startTime: string
  endTime: string
  location: string
  duration: number
}

interface TicketBalance {
  id: string
  ticketId: string
  ticketName: string
  remainingMinutes: number
  expiresAt: string
}

export default function BookingPage() {
  const [selectedTeacher, setSelectedTeacher] = useState<string>('')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<string>('')
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Mock data
  const teachers: Teacher[] = [
    {
      id: '1',
      name: '田中一郎',
      handle: 'tanaka-ichiro',
      subjects: ['数学', '物理'],
      experience: '5年',
      rating: 4.8,
      reviewCount: 24,
    },
    {
      id: '2',
      name: '佐藤花子',
      handle: 'sato-hanako',
      subjects: ['英語', '国語'],
      experience: '3年',
      rating: 4.6,
      reviewCount: 18,
    },
    {
      id: '3',
      name: '鈴木健太',
      handle: 'suzuki-kenta',
      subjects: ['国語', '社会'],
      experience: '7年',
      rating: 4.9,
      reviewCount: 31,
    },
  ]

  const availableSlots: AvailableSlot[] = [
    {
      id: '1',
      teacherId: '1',
      teacher: teachers[0],
      date: new Date(2024, 8, 12),
      startTime: '14:00',
      endTime: '15:00',
      location: 'オンライン',
      duration: 60,
    },
    {
      id: '2',
      teacherId: '1',
      teacher: teachers[0],
      date: new Date(2024, 8, 12),
      startTime: '16:00',
      endTime: '17:00',
      location: 'オンライン',
      duration: 60,
    },
    {
      id: '3',
      teacherId: '2',
      teacher: teachers[1],
      date: new Date(2024, 8, 13),
      startTime: '10:00',
      endTime: '11:00',
      location: 'オンライン',
      duration: 60,
    },
    {
      id: '4',
      teacherId: '2',
      teacher: teachers[1],
      date: new Date(2024, 8, 14),
      startTime: '15:00',
      endTime: '16:30',
      location: 'オンライン',
      duration: 90,
    },
  ]

  const ticketBalances: TicketBalance[] = [
    {
      id: '1',
      ticketId: 'ticket-1',
      ticketName: '田中先生 単発チケット',
      remainingMinutes: 240, // 4時間分
      expiresAt: '2024-11-30',
    },
    {
      id: '2',
      ticketId: 'ticket-2',
      ticketName: '佐藤先生 5回パック',
      remainingMinutes: 180, // 3時間分
      expiresAt: '2024-12-15',
    },
  ]

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const filteredSlots = availableSlots.filter(slot => {
    if (selectedTeacher && slot.teacherId !== selectedTeacher) return false
    if (selectedSubject && !slot.teacher.subjects.includes(selectedSubject)) return false
    return true
  })

  const getSlotsForDate = (date: Date) => {
    return filteredSlots.filter(slot => isSameDay(slot.date, date))
  }

  const getAvailableTickets = (teacherId: string) => {
    // In real app, filter by teacher
    return ticketBalances
  }

  const handleBookSlot = () => {
    if (!selectedSlot || !selectedTicket) return
    
    // In real app, create booking via API
    console.log('Booking created:', {
      slot: selectedSlot,
      ticketId: selectedTicket,
    })
    
    setShowConfirmation(true)
  }

  const resetBooking = () => {
    setSelectedSlot(null)
    setSelectedTicket('')
    setShowConfirmation(false)
  }

  const allSubjects = Array.from(new Set(teachers.flatMap(t => t.subjects)))

  return (
    <ProtectedRoute allowedRoles={['guardian']}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">授業予約</h1>
          <p className="text-gray-600">講師の空き時間から授業を予約しましょう</p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">講師で絞り込み</label>
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                  <SelectTrigger>
                    <SelectValue placeholder="講師を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">すべての講師</SelectItem>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">科目で絞り込み</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="科目を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">すべての科目</SelectItem>
                    {allSubjects.map(subject => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setSelectedTeacher('')
                    setSelectedSubject('')
                  }}
                >
                  フィルターをリセット
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {/* Calendar Navigation */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentWeek(addWeeks(currentWeek, -1))}
                    >
                      ← 前週
                    </Button>
                    <h2 className="text-lg font-semibold">
                      {format(weekStart, 'yyyy年MM月dd日', { locale: ja })} 〜 {format(addDays(weekStart, 6), 'MM月dd日', { locale: ja })}
                    </h2>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                    >
                      次週 →
                    </Button>
                  </div>
                  <Button onClick={() => setCurrentWeek(new Date())}>
                    今週
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Calendar */}
            <Card>
              <CardContent className="p-0">
                <div className="grid grid-cols-7">
                  {/* Header */}
                  {weekDays.map((day, index) => (
                    <div key={index} className="p-4 border-b border-r last:border-r-0 bg-gray-50">
                      <div className="text-center">
                        <div className="text-sm text-gray-600">
                          {format(day, 'EEE', { locale: ja })}
                        </div>
                        <div className="text-lg font-semibold mt-1">
                          {format(day, 'dd')}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Calendar Body */}
                  {weekDays.map((day, index) => {
                    const daySlots = getSlotsForDate(day)
                    return (
                      <div key={index} className="min-h-[200px] p-2 border-b border-r last:border-r-0">
                        <div className="space-y-2">
                          {daySlots.map(slot => (
                            <div
                              key={slot.id}
                              className="p-2 bg-green-50 border border-green-200 rounded text-xs cursor-pointer hover:bg-green-100"
                              onClick={() => setSelectedSlot(slot)}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">
                                  {slot.startTime} - {slot.endTime}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {slot.duration}分
                                </Badge>
                              </div>
                              <div className="flex items-center text-gray-600 mb-1">
                                <User className="w-3 h-3 mr-1" />
                                {slot.teacher.name}
                              </div>
                              <div className="flex items-center text-gray-600 mb-1">
                                <MapPin className="w-3 h-3 mr-1" />
                                {slot.location}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {slot.teacher.subjects.map(subject => (
                                  <Badge key={subject} variant="secondary" className="text-xs">
                                    {subject}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {filteredSlots.length === 0 && (
              <Card className="mt-6">
                <CardContent className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    空き時間がありません
                  </h3>
                  <p className="text-gray-500">
                    フィルター条件を変更するか、別の週を確認してください
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Available Teachers */}
            <Card>
              <CardHeader>
                <CardTitle>利用可能な講師</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teachers.map(teacher => (
                    <div key={teacher.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{teacher.name}</span>
                        <div className="flex items-center text-yellow-500">
                          <span className="text-sm">★ {teacher.rating}</span>
                          <span className="text-xs text-gray-500 ml-1">
                            ({teacher.reviewCount})
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {teacher.subjects.map(subject => (
                          <Badge key={subject} variant="outline" className="text-xs">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-xs text-gray-600">
                        経験年数: {teacher.experience}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ticket Balance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  チケット残高
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ticketBalances.map(ticket => (
                    <div key={ticket.id} className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-1">
                        {ticket.ticketName}
                      </div>
                      <div className="text-sm text-gray-600">
                        残り: {Math.floor(ticket.remainingMinutes / 60)}時間{ticket.remainingMinutes % 60}分
                      </div>
                      <div className="text-xs text-gray-500">
                        有効期限: {ticket.expiresAt}
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
                    チケットを購入
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <Card>
              <CardHeader>
                <CardTitle>凡例</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
                    <span className="text-sm">予約可能</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    <span className="text-sm">予約済み</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Booking Confirmation Dialog */}
        <Dialog open={!!selectedSlot && !showConfirmation} onOpenChange={() => setSelectedSlot(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>授業予約の確認</DialogTitle>
              <DialogDescription>
                以下の内容で授業を予約しますか？
              </DialogDescription>
            </DialogHeader>
            {selectedSlot && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">講師</label>
                      <div className="font-semibold">{selectedSlot.teacher.name}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">科目</label>
                      <div className="flex gap-1">
                        {selectedSlot.teacher.subjects.map(subject => (
                          <Badge key={subject} variant="outline">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">日時</label>
                      <div className="font-semibold">
                        {format(selectedSlot.date, 'MM月dd日（EEE）', { locale: ja })}
                        <br />
                        {selectedSlot.startTime} - {selectedSlot.endTime}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">場所</label>
                      <div className="font-semibold">{selectedSlot.location}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    使用するチケット
                  </label>
                  <Select value={selectedTicket} onValueChange={setSelectedTicket}>
                    <SelectTrigger>
                      <SelectValue placeholder="チケットを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableTickets(selectedSlot.teacherId).map(ticket => (
                        <SelectItem key={ticket.id} value={ticket.id}>
                          <div>
                            <div>{ticket.ticketName}</div>
                            <div className="text-xs text-gray-500">
                              残り: {Math.floor(ticket.remainingMinutes / 60)}時間{ticket.remainingMinutes % 60}分
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setSelectedSlot(null)}>
                    キャンセル
                  </Button>
                  <Button 
                    onClick={handleBookSlot}
                    disabled={!selectedTicket}
                  >
                    予約を確定
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog open={showConfirmation} onOpenChange={resetBooking}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="w-6 h-6 text-green-600" />
                予約が完了しました
              </DialogTitle>
              <DialogDescription>
                講師に通知が送信されました。承認されるまでしばらくお待ちください。
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center pt-4">
              <Button onClick={resetBooking}>
                閉じる
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}