'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Plus, Clock, MapPin, Repeat } from 'lucide-react'
import { format, addDays, startOfWeek, addWeeks, isSameDay } from 'date-fns'
import { ja } from 'date-fns/locale'

interface TimeSlot {
  id: string
  date: Date
  startTime: string
  endTime: string
  location: string
  isPublished: boolean
  isRecurring: boolean
  recurrenceRule?: string
}

export default function TeacherCalendar() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isAddingShift, setIsAddingShift] = useState(false)
  
  // Mock shifts data
  const [shifts, setShifts] = useState<TimeSlot[]>([
    {
      id: '1',
      date: new Date(2024, 8, 12), // September 12, 2024
      startTime: '14:00',
      endTime: '18:00',
      location: 'オンライン',
      isPublished: true,
      isRecurring: true,
      recurrenceRule: '毎週木曜日'
    },
    {
      id: '2',
      date: new Date(2024, 8, 14), // September 14, 2024
      startTime: '10:00',
      endTime: '16:00',
      location: 'オンライン',
      isPublished: true,
      isRecurring: false,
    },
  ])

  const [newShift, setNewShift] = useState({
    startTime: '',
    endTime: '',
    location: 'オンライン',
    isRecurring: false,
    recurrenceType: 'weekly' as 'weekly' | 'monthly',
  })

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }) // Monday start
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getShiftsForDate = (date: Date) => {
    return shifts.filter(shift => isSameDay(shift.date, date))
  }

  const handleAddShift = () => {
    if (!selectedDate || !newShift.startTime || !newShift.endTime) return
    
    const shift: TimeSlot = {
      id: Date.now().toString(),
      date: selectedDate,
      startTime: newShift.startTime,
      endTime: newShift.endTime,
      location: newShift.location,
      isPublished: false,
      isRecurring: newShift.isRecurring,
      recurrenceRule: newShift.isRecurring 
        ? `毎週${format(selectedDate, 'EEEE', { locale: ja })}曜日`
        : undefined
    }

    setShifts(prev => [...prev, shift])
    setIsAddingShift(false)
    setNewShift({
      startTime: '',
      endTime: '',
      location: 'オンライン',
      isRecurring: false,
      recurrenceType: 'weekly',
    })
  }

  const togglePublished = (shiftId: string) => {
    setShifts(prev => prev.map(shift => 
      shift.id === shiftId 
        ? { ...shift, isPublished: !shift.isPublished }
        : shift
    ))
  }

  const deleteShift = (shiftId: string) => {
    setShifts(prev => prev.filter(shift => shift.id !== shiftId))
  }

  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">カレンダー管理</h1>
          <p className="text-gray-600">シフトを登録して、生徒からの予約を受け付けましょう</p>
        </div>

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
                    <div
                      key={index}
                      className="p-4 border-b border-r last:border-r-0 bg-gray-50"
                    >
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
                    const dayShifts = getShiftsForDate(day)
                    return (
                      <div
                        key={index}
                        className="min-h-[200px] p-2 border-b border-r last:border-r-0 cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          setSelectedDate(day)
                          setIsAddingShift(true)
                        }}
                      >
                        <div className="space-y-2">
                          {dayShifts.map((shift) => (
                            <div
                              key={shift.id}
                              className={`p-2 rounded text-xs ${
                                shift.isPublished
                                  ? 'bg-blue-100 border border-blue-200'
                                  : 'bg-gray-100 border border-gray-200'
                              }`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">
                                  {shift.startTime} - {shift.endTime}
                                </span>
                                <div className="flex items-center gap-1">
                                  {shift.isRecurring && (
                                    <Repeat className="w-3 h-3 text-gray-500" />
                                  )}
                                  <Button
                                    size="sm"
                                    variant={shift.isPublished ? "default" : "outline"}
                                    className="h-5 px-2 text-xs"
                                    onClick={() => togglePublished(shift.id)}
                                  >
                                    {shift.isPublished ? '公開中' : '非公開'}
                                  </Button>
                                </div>
                              </div>
                              <div className="flex items-center text-gray-600">
                                <MapPin className="w-3 h-3 mr-1" />
                                {shift.location}
                              </div>
                              {shift.recurrenceRule && (
                                <div className="text-gray-500 mt-1">
                                  {shift.recurrenceRule}
                                </div>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-5 px-2 text-xs mt-2"
                                onClick={() => deleteShift(shift.id)}
                              >
                                削除
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  今週の統計
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">登録シフト</span>
                    <span className="font-semibold">
                      {shifts.filter(s => weekDays.some(day => isSameDay(s.date, day))).length}件
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">公開中</span>
                    <span className="font-semibold text-green-600">
                      {shifts.filter(s => s.isPublished && weekDays.some(day => isSameDay(s.date, day))).length}件
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">繰り返し</span>
                    <span className="font-semibold text-blue-600">
                      {shifts.filter(s => s.isRecurring && weekDays.some(day => isSameDay(s.date, day))).length}件
                    </span>
                  </div>
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
                    <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
                    <span className="text-sm">公開中のシフト</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                    <span className="text-sm">下書きのシフト</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">繰り返しシフト</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>クイックアクション</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full"
                  onClick={() => {
                    setSelectedDate(new Date())
                    setIsAddingShift(true)
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  新しいシフトを追加
                </Button>
                <Button variant="outline" className="w-full">
                  一括公開
                </Button>
                <Button variant="outline" className="w-full">
                  テンプレートから作成
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Shift Dialog */}
        <Dialog open={isAddingShift} onOpenChange={setIsAddingShift}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>シフトを追加</DialogTitle>
              <DialogDescription>
                {selectedDate && format(selectedDate, 'yyyy年MM月dd日（EEE）', { locale: ja })}のシフトを登録します
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">開始時刻</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={newShift.startTime}
                    onChange={(e) => setNewShift(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">終了時刻</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={newShift.endTime}
                    onChange={(e) => setNewShift(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">場所</Label>
                <Select
                  value={newShift.location}
                  onValueChange={(value) => setNewShift(prev => ({ ...prev, location: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="オンライン">オンライン</SelectItem>
                    <SelectItem value="講師宅">講師宅</SelectItem>
                    <SelectItem value="生徒宅">生徒宅</SelectItem>
                    <SelectItem value="その他">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={newShift.isRecurring}
                  onChange={(e) => setNewShift(prev => ({ ...prev, isRecurring: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="recurring">繰り返し設定</Label>
              </div>

              {newShift.isRecurring && (
                <div className="space-y-2">
                  <Label>繰り返し頻度</Label>
                  <Select
                    value={newShift.recurrenceType}
                    onValueChange={(value: 'weekly' | 'monthly') => 
                      setNewShift(prev => ({ ...prev, recurrenceType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">毎週</SelectItem>
                      <SelectItem value="monthly">毎月</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddingShift(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleAddShift}>
                  シフトを追加
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}