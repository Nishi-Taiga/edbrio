'use client'

import { useMemo, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { X, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { useAreaSearch } from '@/hooks/use-area-search'
import { useTranslations } from 'next-intl'
import type { AreaSelection } from '@/lib/types/database'

interface AreaSelectorProps {
  selectedAreas: AreaSelection[]
  onAreasChange: (areas: AreaSelection[]) => void
}

type MunicipalityGroup = { label: string; items: string[] }

function groupMunicipalities(municipalities: string[]): MunicipalityGroup[] {
  const groups: Record<string, string[]> = {}
  for (const m of municipalities) {
    let label = 'その他'
    if (m.endsWith('区')) label = '区'
    else if (m.endsWith('市')) label = '市'
    else if (m.endsWith('町')) label = '町'
    else if (m.endsWith('村')) label = '村'
    if (!groups[label]) groups[label] = []
    groups[label].push(m)
  }
  const order = ['区', '市', '町', '村', 'その他']
  return order.filter(k => groups[k]).map(k => ({ label: k, items: groups[k] }))
}

export function AreaSelector({
  selectedAreas,
  onAreasChange,
}: AreaSelectorProps) {
  const t = useTranslations('teacherProfile')
  const {
    prefectures, municipalities, loading, error,
    selectedPrefecture, setSelectedPrefecture,
  } = useAreaSearch()

  const groups = useMemo(() => groupMunicipalities(municipalities), [municipalities])
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggleCollapse = (label: string) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }))
  }

  const isSelected = (municipality: string) =>
    selectedAreas.some(a => a.municipality === municipality && a.prefecture === selectedPrefecture)

  const toggleMunicipality = (municipality: string) => {
    if (isSelected(municipality)) {
      onAreasChange(selectedAreas.filter(
        a => !(a.municipality === municipality && a.prefecture === selectedPrefecture)
      ))
    } else {
      onAreasChange([...selectedAreas, { prefecture: selectedPrefecture, municipality }])
    }
  }

  const toggleGroup = (group: MunicipalityGroup) => {
    const allSelected = group.items.every(m => isSelected(m))
    if (allSelected) {
      const toRemove = new Set(group.items)
      onAreasChange(selectedAreas.filter(
        a => !(a.prefecture === selectedPrefecture && toRemove.has(a.municipality))
      ))
    } else {
      const toAdd = group.items
        .filter(m => !isSelected(m))
        .map(m => ({ prefecture: selectedPrefecture, municipality: m }))
      onAreasChange([...selectedAreas, ...toAdd])
    }
  }

  const handleRemoveArea = (index: number) => {
    onAreasChange(selectedAreas.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      {/* Prefecture select */}
      <Select value={selectedPrefecture} onValueChange={setSelectedPrefecture}>
        <SelectTrigger>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
            </div>
          ) : (
            <SelectValue placeholder={t('selectPrefecture')} />
          )}
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {prefectures.map(p => (
            <SelectItem key={p} value={p}>{p}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Grouped municipality checkboxes */}
      {selectedPrefecture && groups.length > 0 && (
        <div className="border rounded-md max-h-72 overflow-y-auto">
          {groups.map((group) => {
            const allSelected = group.items.every(m => isSelected(m))
            const someSelected = !allSelected && group.items.some(m => isSelected(m))
            const isCollapsed = collapsed[group.label] ?? false
            return (
              <div key={group.label}>
                <div className="sticky top-0 bg-muted/80 backdrop-blur-sm px-3 py-1.5 border-b flex items-center gap-2">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={() => toggleGroup(group)}
                    id={`group-${group.label}`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleCollapse(group.label)}
                    className="flex items-center gap-1 flex-1 cursor-pointer select-none"
                  >
                    {isCollapsed
                      ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    }
                    <span className="text-xs font-semibold">{group.label} ({group.items.length})</span>
                  </button>
                </div>
                {!isCollapsed && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-2 gap-y-1 px-3 py-2">
                    {group.items.map(m => (
                      <label key={m} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <Checkbox
                          checked={isSelected(m)}
                          onCheckedChange={() => toggleMunicipality(m)}
                        />
                        <span className="truncate">{m}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{t('areaLoadError')}</p>}

      {/* Selected areas as badges */}
      {selectedAreas.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedAreas.map((area, i) => (
            <Badge
              key={`${area.prefecture}-${area.municipality}-${i}`}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {area.municipality}
              <span className="text-xs text-muted-foreground ml-0.5">({area.prefecture})</span>
              <button
                type="button"
                onClick={() => handleRemoveArea(i)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t('noAreasSelected')}</p>
      )}
    </div>
  )
}
