import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { aiReportLimiter } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `あなたは個別指導塾・家庭教師の授業報告書を作成するアシスタントです。
講師が記入した授業メモを元に、保護者が読みやすい丁寧な授業報告書を生成してください。

ルール:
- 丁寧語（です・ます調）で記述
- 300〜500文字程度
- 構成: 本日の学習内容 → お子様の理解度・取り組みの様子 → 課題・宿題 → 次回の予定
- 具体的なポジティブフィードバックを含める
- 改善が必要な点は建設的に表現する
- 保護者に安心感を与えるトーンで書く`

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { success: rateLimitOk } = aiReportLimiter.check(session.user.id)
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'リクエストが多すぎます。しばらくしてからお試しください。' }, { status: 429 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Teachers only' }, { status: 403 })
    }

    const body = await req.json()
    const { contentRaw, studentName, subject, goals, weakPoints, comprehensionLevel, studentMood } = body

    if (!contentRaw || !studentName) {
      return NextResponse.json({ error: 'contentRaw and studentName are required' }, { status: 400 })
    }

    // Build context for the AI
    let userPrompt = `## 授業メモ\n${contentRaw}\n\n## 生徒名\n${studentName}`
    if (subject) userPrompt += `\n\n## 教科\n${subject}`
    if (comprehensionLevel) userPrompt += `\n\n## 理解度（5段階）\n${comprehensionLevel}`
    if (studentMood) {
      const moodMap: Record<string, string> = {
        good: '集中して取り組んでいた',
        neutral: '普通',
        tired: '疲れている様子だった',
        unmotivated: 'やる気が低かった',
      }
      userPrompt += `\n\n## 生徒の様子\n${moodMap[studentMood] || studentMood}`
    }
    if (goals && goals.length > 0) userPrompt += `\n\n## 現在の学習目標\n${goals.join('\n')}`
    if (weakPoints && weakPoints.length > 0) userPrompt += `\n\n## つまずきポイント\n${weakPoints.join('\n')}`

    userPrompt += '\n\n上記の情報をもとに、保護者向けの授業報告書を作成してください。'

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const textBlock = message.content.find(b => b.type === 'text')
    const generatedContent = textBlock ? textBlock.text : ''

    return NextResponse.json({
      generatedContent,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
    })
  } catch (error: unknown) {
    console.error('AI report generation error:', error)
    return NextResponse.json(
      { error: 'レポート生成に失敗しました。しばらくしてからお試しください。' },
      { status: 500 }
    )
  }
}
