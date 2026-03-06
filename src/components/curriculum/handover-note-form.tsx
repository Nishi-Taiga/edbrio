'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useTranslations } from 'next-intl'

interface HandoverNoteFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (note: { content: string; to_teacher_id?: string | null }) => Promise<void>
}

export function HandoverNoteForm({ open, onClose, onSubmit }: HandoverNoteFormProps) {
  const t = useTranslations('curriculum.handover')
  const tc = useTranslations('common')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim()) return
    setSaving(true)
    try {
      await onSubmit({ content: content.trim() })
      setContent('')
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('addTitle')}</DialogTitle>
          <DialogDescription>{t('addDescription')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="handover-content">{t('contentLabel')}</Label>
            <Textarea
              id="handover-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('contentPlaceholder')}
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>{tc('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={saving || !content.trim()}>
            {saving ? tc('adding') : tc('add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
