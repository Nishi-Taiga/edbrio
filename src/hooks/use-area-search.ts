'use client'

import { useState, useEffect, useRef } from 'react'

export function useAreaSearch() {
  const [data, setData] = useState<Record<string, string[]>>({})
  const [selectedPrefecture, setSelectedPrefecture] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    setLoading(true)
    setError(null)

    fetch('/api/areas')
      .then(res => {
        if (!res.ok) throw new Error('API error')
        return res.json()
      })
      .then(json => setData(json))
      .catch(() => setError('Failed to load area data'))
      .finally(() => setLoading(false))
  }, [])

  const prefectures = Object.keys(data)
  const municipalities = selectedPrefecture ? (data[selectedPrefecture] || []) : []

  return {
    prefectures,
    municipalities,
    selectedPrefecture,
    setSelectedPrefecture,
    loading,
    error,
  }
}
