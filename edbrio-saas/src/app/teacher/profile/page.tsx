'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { User, Link2, Save, X } from 'lucide-react'

const SUBJECTS = ['国語', '算数・数学', '英語', '物理', '化学', '生物', '地学', '地理', '歴史', '公民', '小論文']
const GRADES = ['小1', '小2', '小3', '小4', '小5', '小6', '中1', '中2', '中3', '高1', '高2', '高3', '既卒']

export default function TeacherProfile() {
  const { dbUser } = useAuth()
  
  // Mock teacher data - in real app, fetch from Supabase
  const [profile, setProfile] = useState({
    name: 'ε\x86田太郎',
    handle: 'yamada-taro',
    introduction: '数学を専門とする講師です。基礎から応用まで、わかりやすく指導します。',
    subjects: ['数学', '物理'],
    grades: ['高1', '高2', '高3'],
    experience: '5年',
    education: '東京大学理学部数学科卒業',
    certification: '数学検定1級',
    publicProfile: {
      introduction: '数学を専門とする講師です。基礎から応用まで、わかりやすく指導します。',
      experience: '5年',
      education: '東京大学理学部数学科卒業',
      certification: '数学検定1級',
    }
  })

  const [isEditing, setIsEditing] = useState(false)
  const [editingProfile, setEditingProfile] = useState(profile)

  const handleSubjectToggle = (subject: string) => {
    setEditingProfile(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }))
  }

  const handleGradeToggle = (grade: string) => {
    setEditingProfile(prev => ({
      ...prev,
      grades: prev.grades.includes(grade)
        ? prev.grades.filter(g => g !== grade)
        : [...prev.grades, grade]
    }))
  }

  const handleSave = () => {
    // In real app, save to Supabase
    setProfile(editingProfile)
    setIsEditing(false)
    // Show success toast
  }

  const handleCancel = () => {
    setEditingProfile(profile)
    setIsEditing(false)
  }

  const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/teacher/${profile.handle}`

  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">プロフィール設定</h1>
          <p className="text-gray-600">あなたの講師情報を管理し、生徒に公開する内容を設定しましょう</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    基本情報
                  </CardTitle>
                  <CardDescription>講師としての基本的な情報を設定します</CardDescription>
                </div>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="outline">
                    編集
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} size="sm">
                      <Save className="w-4 h-4 mr-1" />
                      保存
                    </Button>
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      <X className="w-4 h-4 mr-1" />
                      キャンセル
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">名前</Label>
                    <Input
                      id="name"
                      value={isEditing ? editingProfile.name : profile.name}
                      onChange={(e) => setEditingProfile(prev => ({ ...prev, name: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="handle">公開URL（ハンドル）</Label>
                    <Input
                      id="handle"
                      value={isEditing ? editingProfile.handle : profile.handle}
                      onChange={(e) => setEditingProfile(prev => ({ ...prev, handle: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="yamada-taro"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>指導可能科目</Label>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECTS.map(subject => {
                      const isSelected = isEditing 
                        ? editingProfile.subjects.includes(subject)
                        : profile.subjects.includes(subject)
                      
                      return (
                        <Badge
                          key={subject}
                          variant={isSelected ? "default" : "outline"}
                          className={`cursor-pointer ${isEditing ? 'hover:bg-blue-100' : ''}`}
                          onClick={isEditing ? () => handleSubjectToggle(subject) : undefined}
                        >
                          {subject}
                        </Badge>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>指導可能学年</Label>
                  <div className="flex flex-wrap gap-2">
                    {GRADES.map(grade => {
                      const isSelected = isEditing
                        ? editingProfile.grades.includes(grade)
                        : profile.grades.includes(grade)
                      
                      return (
                        <Badge
                          key={grade}
                          variant={isSelected ? "default" : "outline"}
                          className={`cursor-pointer ${isEditing ? 'hover:bg-blue-100' : ''}`}
                          onClick={isEditing ? () => handleGradeToggle(grade) : undefined}
                        >
                          {grade}
                        </Badge>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="introduction">自己紹介</Label>
                  <textarea
                    id="introduction"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none h-24 disabled:bg-gray-50"
                    value={isEditing ? editingProfile.introduction : profile.introduction}
                    onChange={(e) => setEditingProfile(prev => ({ ...prev, introduction: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="あなたの指導方針や経験について書いてください"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experience">指導経験</Label>
                    <Input
                      id="experience"
                      value={isEditing ? editingProfile.experience : profile.experience}
                      onChange={(e) => setEditingProfile(prev => ({ ...prev, experience: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="5年"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="education">学歴</Label>
                    <Input
                      id="education"
                      value={isEditing ? editingProfile.education : profile.education}
                      onChange={(e) => setEditingProfile(prev => ({ ...prev, education: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="○○大学○○学部卒業"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certification">資格・認定</Label>
                  <Input
                    id="certification"
                    value={isEditing ? editingProfile.certification : profile.certification}
                    onChange={(e) => setEditingProfile(prev => ({ ...prev, certification: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="数学検定1級"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Profile URL */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="w-5 h-5" />
                  公開プロフィールURL
                </CardTitle>
                <CardDescription>生徒や保護者があなたを見つけるためのURL</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <div className="text-sm font-mono break-all">
                      {profileUrl}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(profileUrl)}
                    >
                      URLをコピー
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(profileUrl, '_blank')}
                    >
                      プレビュー
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Setup Progress */}
            <Card>
              <CardHeader>
                <CardTitle>セットアップ進捗</CardTitle>
                <CardDescription>プロフィール完成まで</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">基本情報</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">完了</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">科目・学年設定</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">完了</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">チケット作成</span>
                    <Badge variant="secondary">未設定</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Stripe連携</span>
                    <Badge variant="secondary">未設定</Badge>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">50% 完了</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>次のステップ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline">
                  チケットを作成
                </Button>
                <Button className="w-full" variant="outline">
                  Stripeアカウント連携
                </Button>
                <Button className="w-full" variant="outline">
                  シフト登録
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}