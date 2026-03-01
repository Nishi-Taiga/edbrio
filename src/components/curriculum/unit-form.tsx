'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslations } from 'next-intl'

interface UnitFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (unit: { subject: string; unit_name: string; description?: string; order_index: number; status: 'not_started' }) => Promise<void>
}

export function UnitForm({ open, onClose, onSubmit }: UnitFormProps) {
  const t = useTranslations('curriculum.units')
  const tc = useTranslations('common')
  const [subject, setSubject] = useState('')
  const [unitName, setUnitName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!subject.trim() || !unitName.trim()) return
    setSaving(true)
    try {
      await onSubmit({
        subject: subject.trim(),
        unit_name: unitName.trim(),
        description: description.trim() || undefined,
        order_index: 0,
        status: 'not_started',
      })
      setSubject(''); setUnitName(''); setDescription('')
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
            <Label htmlFor="unit-subject">{t('subjectLabel')}</Label>
            <Input id="unit-subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder={t('subjectPlaceholder')} />
          </div>
          <div>
            <Label htmlFor="unit-name">{t('nameLabel')}</Label>
            <Input id="unit-name" value={unitName} onChange={e => setUnitName(e.target.value)} placeholder={t('namePlaceholder')} />
          </div>
          <div>
            <Label htmlFor="unit-desc">{t('descriptionLabel')}</Label>
            <textarea
              id="unit-desc"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>{tc('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={saving || !subject.trim() || !unitName.trim()}>
            {saving ? tc('adding') : tc('add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
