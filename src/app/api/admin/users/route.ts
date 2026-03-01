import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminLimiter } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { success: rateLimitOk } = adminLimiter.check(ip)
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
    }

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role') || 'all'
    const plan = searchParams.get('plan') || 'all'
    const search = searchParams.get('search') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const sort = searchParams.get('sort') || 'newest'

    const supabase = createAdminClient()

    // Plan filter: pre-fetch teacher IDs
    let planFilteredTeacherIds: string[] | null = null
    if (plan !== 'all') {
      const { data: filteredTeachers, error: planErr } = await supabase
        .from('teachers')
        .select('id')
        .eq('plan', plan)
      if (planErr) {
        console.error('Failed to query teachers by plan:', planErr)
        return NextResponse.json({ error: 'Failed to filter by plan.' }, { status: 500 })
      }
      planFilteredTeacherIds = (filteredTeachers || []).map((t) => t.id)
      if (planFilteredTeacherIds.length === 0) {
        return NextResponse.json({ users: [], total: 0, page, limit })
      }
    }

    // Build users query
    let query = supabase
      .from('users')
      .select('id, name, email, role, created_at, is_suspended', { count: 'exact' })

    if (role !== 'all') query = query.eq('role', role)
    if (planFilteredTeacherIds) query = query.in('id', planFilteredTeacherIds)
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    query = query.order('created_at', { ascending: sort === 'oldest' })

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: users, error: usersErr, count } = await query
    if (usersErr) {
      console.error('Failed to query users:', usersErr)
      return NextResponse.json({ error: 'Failed to fetch users.' }, { status: 500 })
    }

    const total = count || 0
    const userList = users || []
    const userIds = userList.map((u) => u.id)

    // Enrich with role-specific data
    const teacherIds = userList.filter((u) => u.role === 'teacher').map((u) => u.id)
    const guardianIds = userList.filter((u) => u.role === 'guardian').map((u) => u.id)
    const studentIds = userList.filter((u) => u.role === 'student').map((u) => u.id)

    // Teacher data: plan, subjects, initial setup status, student count
    let teacherMap: Record<string, { plan: string; subjects: string[]; is_onboarding_complete: boolean; student_count: number }> = {}
    if (teacherIds.length > 0) {
      const [teachersRes, tsRes] = await Promise.all([
        supabase.from('teachers').select('id, plan, subjects, is_onboarding_complete').in('id', teacherIds),
        supabase.from('teacher_students').select('teacher_id').in('teacher_id', teacherIds),
      ])
      const teacherRows = teachersRes.data || []
      const tsRows = tsRes.data || []
      // Count students per teacher
      const studentCountMap: Record<string, number> = {}
      tsRows.forEach((r) => {
        studentCountMap[r.teacher_id] = (studentCountMap[r.teacher_id] || 0) + 1
      })
      teacherRows.forEach((t) => {
        teacherMap[t.id] = {
          plan: t.plan,
          subjects: t.subjects || [],
          is_onboarding_complete: t.is_onboarding_complete ?? false,
          student_count: studentCountMap[t.id] || 0,
        }
      })
    }

    // Guardian data: student count
    let guardianMap: Record<string, { student_count: number }> = {}
    if (guardianIds.length > 0) {
      const { data: studentRows } = await supabase
        .from('students')
        .select('guardian_id')
        .in('guardian_id', guardianIds)
      const countMap: Record<string, number> = {}
      ;(studentRows || []).forEach((s) => {
        if (s.guardian_id) countMap[s.guardian_id] = (countMap[s.guardian_id] || 0) + 1
      })
      guardianIds.forEach((id) => {
        guardianMap[id] = { student_count: countMap[id] || 0 }
      })
    }

    // Student data: grade, guardian name, teacher count
    let studentMap: Record<string, { grade: string | null; guardian_name: string | null; teacher_count: number }> = {}
    if (studentIds.length > 0) {
      const [studentsRes, tsRes2] = await Promise.all([
        supabase.from('students').select('id, grade, guardian_id').in('id', studentIds),
        supabase.from('teacher_students').select('student_id').in('student_id', studentIds),
      ])
      const studentRows = studentsRes.data || []
      const tsRows2 = tsRes2.data || []
      // Teacher count per student
      const tCountMap: Record<string, number> = {}
      tsRows2.forEach((r) => {
        tCountMap[r.student_id] = (tCountMap[r.student_id] || 0) + 1
      })
      // Resolve guardian names
      const guardianIdsForStudents = [...new Set(studentRows.filter((s) => s.guardian_id).map((s) => s.guardian_id!))]
      let guardianNameMap: Record<string, string> = {}
      if (guardianIdsForStudents.length > 0) {
        const { data: guardianUsers } = await supabase.from('users').select('id, name').in('id', guardianIdsForStudents)
        ;(guardianUsers || []).forEach((u) => {
          guardianNameMap[u.id] = u.name
        })
      }
      studentRows.forEach((s) => {
        studentMap[s.id] = {
          grade: s.grade || null,
          guardian_name: s.guardian_id ? (guardianNameMap[s.guardian_id] || null) : null,
          teacher_count: tCountMap[s.id] || 0,
        }
      })
    }

    // Build enriched response
    const result = userList.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      created_at: u.created_at,
      is_suspended: u.is_suspended ?? false,
      ...(u.role === 'teacher' && teacherMap[u.id] ? teacherMap[u.id] : {}),
      ...(u.role === 'guardian' && guardianMap[u.id] ? guardianMap[u.id] : {}),
      ...(u.role === 'student' && studentMap[u.id] ? studentMap[u.id] : {}),
    }))

    return NextResponse.json({ users: result, total, page, limit })
  } catch (error: unknown) {
    console.error('Admin users list error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
