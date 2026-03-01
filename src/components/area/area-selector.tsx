'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { X, Loader2 } from 'lucide-react'
import { useAreaSearch } from '@/hooks/use-area-search'
import { useTranslations } from 'next-intl'
import type { AreaSelection } from '@/lib/types/database'

interface AreaSelectorProps {
  selectedAreas: AreaSelection[]
  onAreasChange: (areas: AreaSelection[]) => void
  availableOnline: boolean
  onAvailableOnlineChange: (v: boolean) => void
}

export function AreaSelector({
  selectedAreas,
  onAreasChange,
  availableOnline,
  onAvailableOnlineChange,
}: AreaSelectorProps) {
  const t = useTranslations('teacherProfile')
  const {
    prefectures, municipalities, loading, error,
    selectedPrefecture, setSelectedPrefecture,
  } = useAreaSearch()

  const handleAddMunicipality = (municipality: string) => {
    const alreadySelected = selectedAreas.some(
      a => a.municipality === municipality && a.prefecture === selectedPrefecture
    )
    if (alreadySelected) return

    onAreasChange([
      ...selectedAreas,
      { prefecture: selectedPrefecture, municipality },
    ])
  }

  const handleRemoveArea = (index: number) => {
    onAreasChange(selectedAreas.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      {/* Online toggle */}
      <div className="flex items-center gap-2">
        <Switch checked={availableOnline} onCheckedChange={onAvailableOnlineChange} id="available-online" />
        <Label htmlFor="available-online" className="cursor-pointer">{t('availableOnline')}</Label>
      </div>

      {/* Two-step selects: Prefecture -> Municipality */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Prefecture */}
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
          <SelectContent>
            {prefectures.map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Municipality (selecting adds directly) */}
        <Select
          value=""
          onValueChange={handleAddMunicipality}
          disabled={!selectedPrefecture || loading}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('selectMunicipality')} />
          </SelectTrigger>
          <SelectContent>
            {municipalities.map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
