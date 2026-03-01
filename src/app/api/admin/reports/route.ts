import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminLimiter } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { success } = adminLimiter.check(ip)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = createAdminClient()
    const { searchParams } = new URL(req.url)

    const type = searchParams.get('type') || 'stats'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)))
    const visibility = searchParams.get('visibility')
    const teacherId = searchParams.get('teacher_id')
    const hasAi = searchParams.get('has_ai')

    if (type === 'stats') {
      const now = new Date()
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()

      const [
        totalReportsRes,
        monthReportsRes,
        aiReportsRes,
        comprehensionRes,
        moodRes,
        topAiUsersRes,
      ] = await Promise.all([
        // Total reports
        supabase.from('reports').select('*', { count: 'exact', head: true }),

        // Reports this month
        supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart),

        // AI-generated reports
        supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .not('ai_summary', 'is', null),

        // Comprehension levels for average
        supabase
          .from('reports')
          .select('comprehension_level')
          .not('comprehension_level', 'is', null),

        // Mood distribution
        supabase
          .from('reports')
          .select('student_mood')
          .not('student_mood', 'is', null),

        // Top AI users — reports with ai_summary grouped by teacher
        supabase
          .from('reports')
          .select('teacher_id')
          .not('ai_summary', 'is', null),
      ])

      // Calculate average comprehension
      let avgComprehension: number | null = null
      if (comprehensionRes.data && comprehensionRes.data.length > 0) {
        const total = comprehensionRes.data.reduce(
          (sum, r) => sum + (r.comprehension_level ?? 0),
          0
        )
        avgComprehension = Math.round((total / comprehensionRes.data.length) * 100) / 100
      }

      // Calculate mood distribution
      const moodDistribution: Record<string, number> = {
        good: 0,
        neutral: 0,
        tired: 0,
        unmotivated: 0,
      }
      if (moodRes.data) {
        for (const r of moodRes.data) {
          const mood = r.student_mood as string
          if (mood in moodDistribution) {
            moodDistribution[mood]++
          }
        }
      }

      // Calculate top AI users (top 10 teachers by AI report count)
      const teacherAiCounts = new Map<string, number>()
      if (topAiUsersRes.data) {
        for (const r of topAiUsersRes.data) {
          if (r.teacher_id) {
            teacherAiCounts.set(r.teacher_id, (teacherAiCounts.get(r.teacher_id) || 0) + 1)
          }
        }
      }

      const sortedTeachers = [...teacherAiCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)

      let topAiUsers: Array<{ teacher_id: string; name: string; ai_report_count: number }> = []
      if (sortedTeachers.length > 0) {
        const teacherIds = sortedTeachers.map(([id]) => id)
        const { data: users } = await supabase
          .from('users')
          .select('id, name')
          .in('id', teacherIds)

        const userNameMap = new Map<string, string>()
        if (users) {
          for (const u of users) {
            userNameMap.set(u.id, u.name)
          }
        }

        topAiUsers = sortedTeachers.map(([id, count]) => ({
          teacher_id: id,
          name: userNameMap.get(id) || 'Unknown',
          ai_report_count: count,
        }))
      }

      return NextResponse.json({
        totalReports: totalReportsRes.count ?? 0,
        monthReports: monthReportsRes.count ?? 0,
        aiReports: aiReportsRes.count ?? 0,
        avgComprehension,
        moodDistribution,
        topAiUsers,
      })
    }

    // type === 'list'
    const offset = (page - 1) * limit

    let countQuery = supabase.from('reports').select('*', { count: 'exact', head: true })
    let dataQuery = supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (visibility) {
      countQuery = countQuery.eq('visibility', visibility)
      dataQuery = dataQuery.eq('visibility', visibility)
    }
    if (teacherId) {
      countQuery = countQuery.eq('teacher_id', teacherId)
      dataQuery = dataQuery.eq('teacher_id', teacherId)
    }
    if (hasAi === 'true') {
      countQuery = countQuery.not('ai_summary', 'is', null)
      dataQuery = dataQuery.not('ai_summary', 'is', null)
    } else if (hasAi === 'false') {
      countQuery = countQuery.is('ai_summary', null)
      dataQuery = dataQuery.is('ai_summary', null)
    }

    const [countRes, dataRes] = await Promise.all([countQuery, dataQuery])

    const reports = dataRes.data ?? []

    // Resolve teacher names and student names
    const teacherIds = [...new Set(reports.map((r) => r.teacher_id).filter(Boolean))]
    const profileIds = [...new Set(reports.map((r) => r.profile_id).filter(Boolean))]

    const [teacherNamesRes, studentNamesRes] = await Promise.all([
      teacherIds.length > 0
        ? supabase.from('users').select('id, name').in('id', teacherIds)
        : { data: [] },
      profileIds.length > 0
        ? supabase.from('student_profiles').select('id, name').in('id', profileIds)
        : { data: [] },
    ])

    const teacherNameMap = new Map<string, string>()
    if (teacherNamesRes.data) {
      for (const u of teacherNamesRes.data) {
        teacherNameMap.set(u.id, u.name)
      }
    }

    const studentNameMap = new Map<string, string>()
    if (studentNamesRes.data) {
      for (const s of studentNamesRes.data) {
        studentNameMap.set(s.id, s.name)
      }
    }

    const enrichedReports = reports.map((r) => ({
      ...r,
      teacher_name: teacherNameMap.get(r.teacher_id) || null,
      student_name: studentNameMap.get(r.profile_id) || null,
    }))

    return NextResponse.json({
      reports: enrichedReports,
      total: countRes.count ?? 0,
      page,
      limit,
    })
  } catch (error: unknown) {
    console.error('Admin reports error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report data' },
      { status: 500 }
    )
  }
}
