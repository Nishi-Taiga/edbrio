'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface StationInfo {
  name: string
  prefecture: string
  line: string
}

export function useStationSearch() {
  const [prefectures, setPrefectures] = useState<string[]>([])
  const [lines, setLines] = useState<string[]>([])
  const [stations, setStations] = useState<StationInfo[]>([])
  const [selectedPrefecture, setSelectedPrefecture] = useState('')
  const [selectedLine, setSelectedLine] = useState('')
  const [loading, setLoading] = useState({ prefectures: false, lines: false, stations: false })
  const [error, setError] = useState<string | null>(null)

  const cache = useRef(new Map<string, unknown>())

  const fetchWithCache = useCallback(async <T>(key: string, url: string): Promise<T | null> => {
    if (cache.current.has(key)) return cache.current.get(key) as T
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      cache.current.set(key, data)
      return data as T
    } catch {
      setError('駅データの取得に失敗しました')
      return null
    }
  }, [])

  // Fetch prefectures on mount
  useEffect(() => {
    let cancelled = false
    setLoading(prev => ({ ...prev, prefectures: true }))
    setError(null)

    fetchWithCache<{ prefecture: string[] }>('prefectures', '/api/stations?method=getPrefectures')
      .then(data => {
        if (!cancelled && data?.prefecture) setPrefectures(data.prefecture)
      })
      .finally(() => {
        if (!cancelled) setLoading(prev => ({ ...prev, prefectures: false }))
      })

    return () => { cancelled = true }
  }, [fetchWithCache])

  // Fetch lines when prefecture changes
  useEffect(() => {
    if (!selectedPrefecture) {
      setLines([])
      setStations([])
      setSelectedLine('')
      return
    }

    let cancelled = false
    setLoading(prev => ({ ...prev, lines: true }))
    setLines([])
    setStations([])
    setSelectedLine('')
    setError(null)

    fetchWithCache<{ line: string[] }>(
      `lines:${selectedPrefecture}`,
      `/api/stations?method=getLines&prefecture=${encodeURIComponent(selectedPrefecture)}`
    ).then(data => {
      if (!cancelled && data?.line) setLines(data.line)
    }).finally(() => {
      if (!cancelled) setLoading(prev => ({ ...prev, lines: false }))
    })

    return () => { cancelled = true }
  }, [selectedPrefecture, fetchWithCache])

  // Fetch stations when line changes
  useEffect(() => {
    if (!selectedLine) {
      setStations([])
      return
    }

    let cancelled = false
    setLoading(prev => ({ ...prev, stations: true }))
    setStations([])
    setError(null)

    fetchWithCache<{ station: StationInfo[] }>(
      `stations:${selectedLine}`,
      `/api/stations?method=getStations&line=${encodeURIComponent(selectedLine)}`
    ).then(data => {
      if (!cancelled && data?.station) setStations(data.station)
    }).finally(() => {
      if (!cancelled) setLoading(prev => ({ ...prev, stations: false }))
    })

    return () => { cancelled = true }
  }, [selectedLine, fetchWithCache])

  return {
    prefectures,
    lines,
    stations,
    loading,
    error,
    selectedPrefecture,
    selectedLine,
    setSelectedPrefecture,
    setSelectedLine,
  }
}
