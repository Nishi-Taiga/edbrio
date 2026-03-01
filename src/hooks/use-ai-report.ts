'use client'

import { useState, useCallback } from 'react'

const MAX_GENERATIONS_PER_REPORT = 3

interface GenerateReportParams {
  contentRaw: string
  studentName: string
  subject?: string
  goals?: string[]
  weakPoints?: string[]
  comprehensionLevel?: number
  studentMood?: string
  maxLength?: number
  teachingStyle?: string
}

export function useAiReport() {
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generationCount, setGenerationCount] = useState(0)

  const remainingGenerations = MAX_GENERATIONS_PER_REPORT - generationCount
  const canGenerate = generationCount < MAX_GENERATIONS_PER_REPORT

  const generateReport = useCallback(async (params: GenerateReportParams) => {
    try {
      setLoading(true)
      setError(null)
      setGeneratedContent(null)

      const res = await fetch('/api/ai/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `API error: ${res.status}`)
      }

      const data = await res.json()
      setGeneratedContent(data.generatedContent)
      setGenerationCount(prev => prev + 1)
      return data.generatedContent
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setGeneratedContent(null)
    setError(null)
  }, [])

  return {
    generateReport,
    generatedContent,
    loading,
    error,
    reset,
    generationCount,
    remainingGenerations,
    canGenerate,
    maxGenerations: MAX_GENERATIONS_PER_REPORT,
  }
}
