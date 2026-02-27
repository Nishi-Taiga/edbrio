'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface UserFiltersProps {
  role?: string
  plan?: string
  search?: string
}

export function UserFilters({ role = 'all', plan = 'all', search = '' }: UserFiltersProps) {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState(search)

  function apply(overrides: Record<string, string>) {
    const q = new URLSearchParams()
    const merged = { role, plan, search: searchValue, ...overrides }
    if (merged.role && merged.role !== 'all') q.set('role', merged.role)
    if (merged.plan && merged.plan !== 'all') q.set('plan', merged.plan)
    if (merged.search) q.set('search', merged.search)
    router.push(`/admin/users?${q.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <select
        value={role}
        onChange={(e) => apply({ role: e.target.value })}
        className="rounded border px-3 py-1.5 text-sm bg-background"
      >
        <option value="all">全ロール</option>
        <option value="teacher">講師</option>
        <option value="guardian">保護者</option>
        <option value="student">生徒</option>
      </select>

      <select
        value={plan}
        onChange={(e) => apply({ plan: e.target.value })}
        className="rounded border px-3 py-1.5 text-sm bg-background"
      >
        <option value="all">全プラン</option>
        <option value="free">Free</option>
        <option value="pro">Pro</option>
      </select>

      <div className="flex gap-1">
        <input
          type="text"
          placeholder="名前・メールで検索"
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
