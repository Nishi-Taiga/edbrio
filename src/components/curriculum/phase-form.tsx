'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface PhaseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (phase: { phase_name: string; start_date?: string; end_date?: string }) => Promise<void>
  initialData?: { phase_name: string; start_date?: string; end_date?: string }
  materialName?: string
  t: (key: string) => string
}

export function PhaseForm({ open, onOpenChange, onSubmit, initialData, materialName, t }: PhaseFormProps) {
  const [phaseName, setPhaseName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setPhaseName(initialData?.phase_name ?? '')
      setStartDate(initialData?.start_date ?? '')
      setEndDate(initialData?.end_date ?? '')
    }
  }, [open, initialData])

  const handleSubmit = async () => {
    if (!phaseName.trim()) return
    setSaving(true)
    try {
      await onSubmit({
        phase_name: phaseName.trim(),
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const isEdit = !!initialData

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t('editPhase') : t('addPhase')}</DialogTitle>
          {materialName && <p className="text-xs text-muted-foreground">{materialName}</p>}
          <DialogDescription>{isEdit ? t('editPhaseDescription') : t('addPhaseDescription')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="phase-name">{t('phaseName')}</Label>
            <Input
              id="phase-name"
              value={phaseName}
              onChange={e => setPhaseName(e.target.value)}
              placeholder={t('phaseNamePlaceholder')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phase-start">{t('startDate')}</Label>
              <Input
                id="phase-start"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phase-end">{t('endDate')}</Label>
              <Input
                id="phase-end"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !phaseName.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? t('save') : t('add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
