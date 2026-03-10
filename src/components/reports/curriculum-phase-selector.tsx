'use client'

import { useState, useEffect, useMemo } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { CurriculumMaterial, CurriculumPhase } from '@/lib/types/database'

interface CurriculumPhaseSelectorProps {
  profileId: string
  selectedPhaseIds: string[]
  onChange: (phaseIds: string[]) => void
}

export function CurriculumPhaseSelector({
  profileId,
  selectedPhaseIds,
  onChange,
}: CurriculumPhaseSelectorProps) {
  const [materials, setMaterials] = useState<CurriculumMaterial[]>([])
  const [phases, setPhases] = useState<CurriculumPhase[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedMaterials, setExpandedMaterials] = useState<Set<string>>(new Set())
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!profileId) return
    let mounted = true
    const fetch = async () => {
      setLoading(true)
      const { data: mats } = await supabase
        .from('curriculum_materials')
        .select('*')
        .eq('profile_id', profileId)
        .order('order_index', { ascending: true })
      if (!mounted) return
      const fetchedMats = mats || []
      setMaterials(fetchedMats)

      if (fetchedMats.length > 0) {
        const { data: phs } = await supabase
          .from('curriculum_phases')
          .select('*')
          .in('material_id', fetchedMats.map(m => m.id))
          .order('order_index', { ascending: true })
        if (!mounted) return
        setPhases(phs || [])
      }
      setLoading(false)
    }
    fetch()
    return () => { mounted = false }
  }, [profileId, supabase])

  const toggleMaterial = (materialId: string) => {
    setExpandedMaterials(prev => {
      const next = new Set(prev)
      if (next.has(materialId)) next.delete(materialId)
      else next.add(materialId)
      return next
    })
  }

  const togglePhase = (phaseId: string) => {
    onChange(
      selectedPhaseIds.includes(phaseId)
        ? selectedPhaseIds.filter(id => id !== phaseId)
        : [...selectedPhaseIds, phaseId]
    )
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '完了'
      case 'in_progress': return '進行中'
      default: return '未着手'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'in_progress': return 'text-blue-600'
      default: return 'text-gray-400'
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground py-2">読み込み中...</div>
  }

  if (materials.length === 0) {
    return <div className="text-sm text-muted-foreground py-2">カリキュラムが登録されていません</div>
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 mb-2">
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">扱った教材・フェーズ</span>
      </div>
      <div className="rounded-md border border-input max-h-[240px] overflow-y-auto">
        {materials.map(mat => {
          const matPhases = phases.filter(p => p.material_id === mat.id)
          const isExpanded = expandedMaterials.has(mat.id)
          const selectedCount = matPhases.filter(p => selectedPhaseIds.includes(p.id)).length

          return (
            <div key={mat.id}>
              <button
                type="button"
                onClick={() => toggleMaterial(mat.id)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: mat.color || '#6B7280' }}
                />
                <span className="font-medium truncate">{mat.material_name}</span>
                <span className="text-xs text-muted-foreground ml-auto shrink-0">
                  {mat.subject}
                  {selectedCount > 0 && (
                    <span className="ml-1 text-brand-600 font-medium">({selectedCount})</span>
                  )}
                </span>
              </button>
              {isExpanded && matPhases.length > 0 && (
                <div className="pl-6 pr-3 pb-1">
                  {matPhases.map(phase => (
                    <label
                      key={phase.id}
                      className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/30 cursor-pointer text-sm"
                    >
                      <Checkbox
                        checked={selectedPhaseIds.includes(phase.id)}
                        onCheckedChange={() => togglePhase(phase.id)}
                      />
                      <span className="truncate flex-1">{phase.phase_name}</span>
                      <span className={`text-[11px] shrink-0 ${getStatusColor(phase.status)}`}>
                        {getStatusLabel(phase.status)}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {isExpanded && matPhases.length === 0 && (
                <div className="pl-10 pr-3 pb-2 text-xs text-muted-foreground">
                  フェーズなし
                </div>
              )}
            </div>
          )
        })}
      </div>
      {selectedPhaseIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedPhaseIds.length}件のフェーズを選択中
        </p>
      )}
    </div>
  )
}
