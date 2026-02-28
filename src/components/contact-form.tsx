'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Send, Check } from 'lucide-react'

interface ContactFormProps {
  defaultName?: string
  defaultEmail?: string
}

export function ContactForm({ defaultName, defaultEmail }: ContactFormProps) {
  const [form, setForm] = useState({ name: defaultName || '', email: defaultEmail || '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '送信に失敗しました')
      }
      setStatus('sent')
      setForm(prev => ({ ...prev, message: '' }))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '送信に失敗しました')
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">送信完了</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">お問い合わせありがとうございます。担当者より折り返しご連絡いたします。</p>
          <Button variant="outline" onClick={() => setStatus('idle')}>新しいお問い合わせ</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>お問い合わせ</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="contact-name">お名前</Label>
            <Input
              id="contact-name"
              required
              maxLength={100}
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="山田 太郎"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">メールアドレス</Label>
            <Input
              id="contact-email"
              type="email"
              required
              maxLength={254}
              value={form.email}
              onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="example@email.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-message">お問い合わせ内容</Label>
            <Textarea
              id="contact-message"
              required
              maxLength={5000}
              rows={5}
              value={form.message}
              onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
              placeholder="ご質問・ご要望・不具合のご報告など、お気軽にご記入ください"
            />
          </div>
          <Button type="submit" disabled={status === 'sending'} className="w-full">
            {status === 'sending' ? '送信中...' : <><Send className="w-4 h-4 mr-1" /> 送信する</>}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
