'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { X, Loader2 } from 'lucide-react'
import { useStationSearch } from '@/hooks/use-station-search'
import { useTranslations } from 'next-intl'
import type { StationSelection } from '@/lib/types/database'

interface StationSelectorProps {
  selectedStations: StationSelection[]
  onStationsChange: (stations: StationSelection[]) => void
  availableOnline: boolean
  onAvailableOnlineChange: (v: boolean) => void
}

export function StationSelector({
  selectedStations,
  onStationsChange,
  availableOnline,
  onAvailableOnlineChange,
}: StationSelectorProps) {
  const t = useTranslations('teacherProfile')
  const {
    prefectures, lines, stations, loading, error,
    selectedPrefecture, selectedLine,
    setSelectedPrefecture, setSelectedLine,
  } = useStationSearch()

  const handleAddStation = (stationName: string) => {
    const alreadySelected = selectedStations.some(
      s => s.name === stationName && s.line === selectedLine
    )
    if (alreadySelected) return

    onStationsChange([
      ...selectedStations,
      { name: stationName, line: selectedLine, prefecture: selectedPrefecture },
    ])
  }

  const handleRemoveStation = (index: number) => {
    onStationsChange(selectedStations.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      {/* Online toggle */}
      <div className="flex items-center gap-2">
        <Switch checked={availableOnline} onCheckedChange={onAvailableOnlineChange} id="available-online" />
        <Label htmlFor="available-online" className="cursor-pointer">{t('availableOnline')}</Label>
      </div>

      {/* Cascading selects */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Prefecture */}
        <Select value={selectedPrefecture} onValueChange={setSelectedPrefecture}>
          <SelectTrigger>
            {loading.prefectures ? (
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

        {/* Line */}
        <Select
          value={selectedLine}
          onValueChange={setSelectedLine}
          disabled={!selectedPrefecture || loading.lines}
        >
          <SelectTrigger>
            {loading.lines ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
              </div>
            ) : (
              <SelectValue placeholder={t('selectLine')} />
            )}
          </SelectTrigger>
          <SelectContent>
            {lines.map(l => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Station (selecting adds directly) */}
        <Select
          value=""
          onValueChange={handleAddStation}
          disabled={!selectedLine || loading.stations}
        >
          <SelectTrigger>
            {loading.stations ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
              </div>
            ) : (
              <SelectValue placeholder={t('selectStation')} />
            )}
          </SelectTrigger>
          <SelectContent>
            {stations.map(s => (
              <SelectItem key={`${s.line}-${s.name}`} value={s.name}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-xs text-destructive">{t('stationLoadError')}</p>}

      {/* Selected stations as badges */}
      {selectedStations.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedStations.map((station, i) => (
            <Badge
              key={`${station.line}-${station.name}-${i}`}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {station.name}
              <span className="text-xs text-muted-foreground ml-0.5">({station.line})</span>
              <button
                type="button"
                onClick={() => handleRemoveStation(i)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t('noStationsSelected')}</p>
      )}
    </div>
  )
}
