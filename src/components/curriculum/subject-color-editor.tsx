'use client'

import { useState } from 'react'
import { Palette } from 'lucide-react'

const PRESET_COLORS = [
  '#0C5394',
  '#45818E',
  '#8E7CC3',
  '#F1C232',
  '#BE123C',
  '#059669',
  '#1D4ED8',
  '#B45309',
  '#4338CA',
  '#15803D',
]

interface SubjectColorEditorProps {
  subjects: string[]
  subjectColors: Record<string, string>
  onChange: (colors: Record<string, string>) => void
}

export function SubjectColorEditor({ subjects, subjectColors, onChange }: SubjectColorEditorProps) {
  const [activeSubject, setActiveSubject] = useState<string | null>(null)
  const [customHex, setCustomHex] = useState('')

  const handleColorSelect = (subject: string, color: string) => {
    onChange({ ...subjectColors, [subject]: color })
    setActiveSubject(null)
    setCustomHex('')
  }

  const handleCustomHexSubmit = (subject: string) => {
    const hex = customHex.startsWith('#') ? customHex : `#${customHex}`
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      handleColorSelect(subject, hex)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Palette className="w-3.5 h-3.5" />
        <span>教科カラー</span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {subjects.map((subject) => {
          const color = subjectColors[subject] || PRESET_COLORS[0]
          const isActive = activeSubject === subject

          return (
            <div key={subject} className="relative">
              <button
                type="button"
                onClick={() => setActiveSubject(isActive ? null : subject)}
                className="flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-muted/50 transition-colors"
              >
                <span
                  className="w-5 h-5 rounded-full border border-border shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs">{subject}</span>
              </button>

              {isActive && (
                <div className="absolute top-full left-0 z-10 mt-1 p-2 bg-popover border border-border rounded-lg shadow-md min-w-[180px]">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {PRESET_COLORS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleColorSelect(subject, preset)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          color === preset
                            ? 'border-ring ring-2 ring-ring/30 scale-110'
                            : 'border-transparent hover:scale-110'
                        }`}
                        style={{ backgroundColor: preset }}
                        title={preset}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={customHex}
                      onChange={(e) => setCustomHex(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCustomHexSubmit(subject)
                      }}
                      placeholder="#hex"
                      className="flex-1 h-7 px-2 text-xs rounded border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
                      maxLength={7}
                    />
                    <button
                      type="button"
                      onClick={() => handleCustomHexSubmit(subject)}
                      className="h-7 px-2 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      OK
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
