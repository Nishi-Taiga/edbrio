'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Clock, MapPin, Star, GraduationCap, Award, Users, BookOpen, ArrowRight } from 'lucide-react'
import { format, addDays, isSameDay, startOfWeek } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'

interface TeacherProfile {
  id: string
  name: string
  handle: string
  introduction: string
  subjects: string[]
  grades: string[]
  experience: string
  education: string
  certification: string
  rating: number
  reviewCount: number
  responseRate: number
  lessonCount: number
  profileImage?: string
}

interface TicketType {
  id: string
  name: string
  minutes: number
  bundleQty: number
  priceCents: number
  validDays: number
  discount?: number
}

interface AvailableSlot {
  id: string
  date: Date
  startTime: string
  endTime: string
  location: string
  duration: number
}

interface Review {
  id: string
  studentName: string
  rating: number
  comment: string
  subject: string
  date: string
}

export default function TeacherPublicProfile({ params }: { params: { handle: string } }) {
  const [currentWeek, setCurrentWeek] = useState(new Date())

  // Mock data - in real app, fetch from API using params.handle
  const teacher: TeacherProfile = {
    id: '1',
    name: '田中一郎',
    handle: 'tanaka-ichiro',
    introduction: '数学の楽しさを伝える指導を心がけています。基礎から応用まで、生徒さんのペースに合わせた丁寧な指導を行います。わからないところは何度でも質問してください。一緒に数学を得意科目にしましょう！',
    subjects: ['数学', '物理'],
    grades: ['高1', '高2', '高3'],
    experience: '5年',
    education: '東京大学理学部数学科卒業',
    certification: '数学検定1級、高校数学教員免許',
    rating: 4.8,
    reviewCount: 24,
    responseRate: 98,
    lessonCount: 156,
    profileImage: '/teacher-avatar-1.jpg',
  }

  const tickets: TicketType[] = [
    {
      id: '1',
      name: '数学 単発授業',
      minutes: 60,
      bundleQty: 1,
      priceCents: 500000,
      validDays: 30,
    },
    {
      id: '2',
      name: '数学 5回パック',
      minutes: 60,
      bundleQty: 5,
      priceCents: 2250000,
      validDays: 90,
      discount: 10,
    },
    {
      id: '3',
      name: '物理 単発授業',
      minutes: 60,
      bundleQty: 1,
      priceCents: 520000,
      validDays: 30,
    },
  ]

  const availableSlots: AvailableSlot[] = [
    {
      id: '1',
      date: new Date(2024, 8, 12),
      startTime: '14:00',
      endTime: '15:00',
      location: 'オンライン',
      duration: 60,
    },
    {
      id: '2',
      date: new Date(2024, 8, 12),
      startTime: '16:00',
      endTime: '17:00',
      location: 'オンライン',
      duration: 60,
    },
    {
      id: '3',
      date: new Date(2024, 8, 14),
      startTime: '10:00',
      endTime: '11:00',
      location: 'オンライン',
      duration: 60,
    },
    {
      id: '4',
      date: new Date(2024, 8, 15),
      startTime: '15:00',
      endTime: '16:30',
      location: 'オンライン',
      duration: 90,
    },
  ]

  const reviews: Review[] = [
    {
      id: '1',
      studentName: '高校2年生の保護者',
      rating: 5,
      comment: 'とても丁寧な指導で、息子の数学の成績が大幅に向上しました。分からないところも親身になって教えてくださり、感謝しています。',
      subject: '数学',
      date: '2024-08-15',
    },
    {
      id: '2',
      studentName: '高校3年生の保護者',
      rating: 5,
      comment: '受験対策で利用させていただきました。的確な指導とアドバイスで、志望校に合格することができました。',
      subject: '数学',
      date: '2024-07-20',
    },
    {
      id: '3',
      studentName: '高校1年生の保護者',
      rating: 4,
      comment: '物理が苦手だった娘が、田中先生の授業を受けてから理解度が格段に上がりました。',
      subject: '物理',
      date: '2024-06-10',
    },
  ]

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getSlotsForDate = (date: Date) => {
    return availableSlots.filter(slot => isSameDay(slot.date, date))
  }

  const formatPrice = (priceCents: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(priceCents / 100)
  }

  const calculateUnitPrice = (priceCents: number, bundleQty: number) => {
    return formatPrice(priceCents / bundleQty)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-blue-600 hover:underline">
            ← EdBrioトップに戻る
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Teacher Profile */}
            <Card>
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={teacher.profileImage} alt={teacher.name} />
                    <AvatarFallback className="text-2xl">
                      {teacher.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h1 className="text-3xl font-bold text-gray-900">{teacher.name}</h1>
                      <div className="flex items-center gap-1">
                        {renderStars(teacher.rating)}
                        <span className="ml-2 text-sm text-gray-600">
                          {teacher.rating} ({teacher.reviewCount}件のレビュー)
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {teacher.subjects.map(subject => (
                        <Badge key={subject} variant="default" className="px-3 py-1">
                          {subject}
                        </Badge>
                      ))}
                      {teacher.grades.map(grade => (
                        <Badge key={grade} variant="outline" className="px-3 py-1">
                          {grade}
                        </Badge>
                      ))}
                    </div>

                    <p className="text-gray-700 leading-relaxed mb-4">
                      {teacher.introduction}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-lg text-blue-600">{teacher.experience}</div>
                        <div className="text-gray-600">指導経験</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg text-blue-600">{teacher.lessonCount}回</div>
                        <div className="text-gray-600">総授業数</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg text-blue-600">{teacher.responseRate}%</div>
                        <div className="text-gray-600">返信率</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg text-blue-600">24時間以内</div>
                        <div className="text-gray-600">平均返信時間</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Qualifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  学歴・資格
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <GraduationCap className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <div className="font-semibold">学歴</div>
                      <div className="text-gray-600">{teacher.education}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <div className="font-semibold">資格・認定</div>
                      <div className="text-gray-600">{teacher.certification}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Slots */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  空き時間（今週）
                </CardTitle>
                <CardDescription>
                  {format(weekStart, 'MM月dd日', { locale: ja })} 〜 {format(addDays(weekStart, 6), 'MM月dd日', { locale: ja })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day, index) => {
                    const daySlots = getSlotsForDate(day)
                    return (
                      <div key={index} className="text-center">
                        <div className="text-sm font-medium text-gray-600 mb-2">
                          {format(day, 'EEE', { locale: ja })}
                        </div>
                        <div className="text-lg font-semibold mb-2">
                          {format(day, 'dd')}
                        </div>
                        <div className="space-y-1">
                          {daySlots.map(slot => (
                            <div
                              key={slot.id}
                              className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                            >
                              {slot.startTime}-{slot.endTime.slice(0, 2)}:{slot.endTime.slice(3)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-6 text-center">
                  <Link href="/auth">
                    <Button size="lg" className="px-8">
                      授業を予約する
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  生徒・保護者からの評価
                </CardTitle>
                <CardDescription>
                  {teacher.reviewCount}件のレビュー（平均評価: {teacher.rating}）
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {reviews.map(review => (
                    <div key={review.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{review.studentName}</span>
                          <Badge variant="outline" className="text-xs">
                            {review.subject}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                          <span className="text-sm text-gray-600 ml-2">
                            {review.date}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>授業情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    授業時間
                  </span>
                  <span>60分〜90分</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    授業形式
                  </span>
                  <span>オンライン</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    対象学年
                  </span>
                  <span>{teacher.grades.join('・')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    指導科目
                  </span>
                  <span>{teacher.subjects.join('・')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Ticket Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>料金プラン</CardTitle>
                <CardDescription>チケット制による前払いシステム</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tickets.map(ticket => (
                  <div key={ticket.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">{ticket.name}</div>
                      {ticket.discount && (
                        <Badge className="bg-red-100 text-red-800 text-xs">
                          {ticket.discount}% OFF
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      {ticket.minutes}分 × {ticket.bundleQty}回
                      {ticket.bundleQty > 1 && (
                        <span className="ml-2">
                          (単価: {calculateUnitPrice(ticket.priceCents, ticket.bundleQty)})
                        </span>
                      )}
                    </div>
                    <div className="text-xl font-bold text-blue-600">
                      {formatPrice(ticket.priceCents)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      有効期限: {ticket.validDays}日間
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6 text-center">
                <h3 className="font-bold text-lg mb-2">授業を始めませんか？</h3>
                <p className="text-sm text-gray-600 mb-4">
                  まずはアカウント作成から始めましょう
                </p>
                <Link href="/auth">
                  <Button className="w-full mb-2">
                    無料でアカウント作成
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button variant="outline" className="w-full">
                    ログイン
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle>お問い合わせ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>ご質問やご相談がございましたら、お気軽にお問い合わせください。</p>
                  <div className="pt-2">
                    <div>返信時間: 24時間以内</div>
                    <div>返信率: {teacher.responseRate}%</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  メッセージを送る
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}