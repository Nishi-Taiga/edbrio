'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ReportFiltersProps {
  visibility?: string
  search?: string
}

export function ReportFilters({ visibility = 'all', search = '' }: ReportFiltersProps) {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState(search)

  function apply(overrides: Record<string, string>) {
    const q = new URLSearchParams()
    const merged = { visibility, search: searchValue, ...overrides }
    if (merged.visibility && merged.visibility !== 'all') q.set('visibility', merged.visibility)
    if (merged.search) q.set('search', merged.search)
    router.push(`/admin/reports?${q.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <select
        value={visibility}
        onChange={(e) => apply({ visibility: e.target.value })}
        className="rounded border px-3 py-1.5 text-sm bg-background"
      >
        <option value="all">全状態</option>
        <option value="published">公開</option>
        <option value="draft">下書き</option>
      </select>

      <div className="flex gap-1">
        <input
          type="text"
          placeholder="科目・内容で検索"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && apply({ search: searchValue })}
          className="rounded border px-3 py-1.5 text-sm bg-background w-48"
        />
        <Button variant="outline" size="sm" onClick={() => apply({ search: searchValue })}>
          検索
        </Button>
      </div>
    </div>
  )
}
