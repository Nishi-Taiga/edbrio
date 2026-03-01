import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminLimiter } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// ── GET — Fetch user detail ──

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { success: rateLimitOk } = adminLimiter.check(ip)
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait.' },
        { status: 429 }
      )
    }

    const supabase = createAdminClient()

    // Fetch base user info
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, name, email, role, created_at, updated_at, is_suspended')
      .eq('id', id)
      .single()

    if (userErr || !user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    let detail: Record<string, unknown> = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
      is_suspended: user.is_suspended ?? false,
    }

    // ── Teacher detail ──
    if (user.role === 'teacher') {
      const [teacherRes, studentCountRes, paymentsRes, ticketsRes] =
        await Promise.all([
          supabase
            .from('teachers')
            .select(
              'plan, stripe_account_id, stripe_customer_id, stripe_subscription_id, is_onboarding_complete'
            )
            .eq('id', id)
            .single(),
          supabase
            .from('teacher_students')
            .select('id', { count: 'exact', head: true })
            .eq('teacher_id', id),
          supabase
            .from('payments')
            .select('*')
            .eq('teacher_id', id)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('tickets')
            .select('*')
            .eq('teacher_id', id)
            .order('created_at', { ascending: false }),
        ])

      detail = {
        ...detail,
        teacher: teacherRes.data || null,
        student_count: studentCountRes.count || 0,
        recent_payments: paymentsRes.data || [],
        tickets: ticketsRes.data || [],
      }
    }

    // ── Guardian detail ──
    if (user.role === 'guardian') {
      const [guardianRes, studentsRes, paymentsRes] = await Promise.all([
        supabase
          .from('guardians')
          .select('phone')
          .eq('id', id)
          .single(),
        supabase
          .from('students')
          .select('*')
          .eq('guardian_id', id),
        supabase
          .from('payments')
          .select('*')
          .eq('payer_id', id)
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      const studentIds = (studentsRes.data || []).map((s) => s.id)

      let ticketBalances: unknown[] = []
      if (studentIds.length > 0) {
        const { data: balances } = await supabase
          .from('ticket_balances')
          .select('*')
          .in('student_id', studentIds)

        ticketBalances = balances || []
      }

      detail = {
        ...detail,
        guardian: guardianRes.data || null,
        students: studentsRes.data || [],
        recent_payments: paymentsRes.data || [],
        ticket_balances: ticketBalances,
      }
    }

    // ── Student detail ──
    if (user.role === 'student') {
      const [studentRes, teacherStudentsRes, bookingsRes] = await Promise.all([
        supabase
          .from('students')
          .select('*')
          .eq('id', id)
          .single(),
        supabase
          .from('teacher_students')
          .select('teacher_id')
          .eq('student_id', id),
        supabase
          .from('bookings')
          .select('*')
          .eq('student_id', id)
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      // Fetch guardian info if present
      let guardian: unknown = null
      if (studentRes.data?.guardian_id) {
        const { data: guardianUser } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('id', studentRes.data.guardian_id)
          .single()

        guardian = guardianUser || null
      }

      // Fetch teacher names for assigned teachers
      const teacherIds = (teacherStudentsRes.data || []).map((ts) => ts.teacher_id)
      let assignedTeachers: unknown[] = []
      if (teacherIds.length > 0) {
        const { data: teachers } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', teacherIds)

        assignedTeachers = teachers || []
      }

      detail = {
        ...detail,
        student: studentRes.data || null,
        guardian,
        assigned_teachers: assignedTeachers,
        recent_bookings: bookingsRes.data || [],
      }
    }

    return NextResponse.json(detail)
  } catch (error: unknown) {
    console.error('Admin user detail error:', error)
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    )
  }
}

// ── PATCH — Update user ──

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { success: rateLimitOk } = adminLimiter.check(ip)
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { plan, is_suspended } = body as {
      plan?: 'free' | 'pro'
      is_suspended?: boolean
    }

    // Validate that at least one field is provided
    if (plan === undefined && is_suspended === undefined) {
      return NextResponse.json(
        { error: 'No update fields provided.' },
        { status: 400 }
      )
    }

    // Validate field values
    if (plan !== undefined && plan !== 'free' && plan !== 'pro') {
      return NextResponse.json(
        { error: 'Invalid plan value. Must be "free" or "pro".' },
        { status: 400 }
      )
    }

    if (is_suspended !== undefined && typeof is_suspended !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid is_suspended value. Must be a boolean.' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Verify user exists
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', id)
      .single()

    if (userErr || !user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    // Update is_suspended on users table
    if (is_suspended !== undefined) {
      const { error: suspendErr } = await supabase
        .from('users')
        .update({
          is_suspended,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (suspendErr) {
        console.error('Failed to update is_suspended:', suspendErr)
        return NextResponse.json(
          { error: 'Failed to update suspension status.' },
          { status: 500 }
        )
      }
    }

    // Update plan on teachers table
    if (plan !== undefined) {
      if (user.role !== 'teacher') {
        return NextResponse.json(
          { error: 'Plan can only be updated for teachers.' },
          { status: 400 }
        )
      }

      const { error: planErr } = await supabase
        .from('teachers')
        .update({
          plan,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (planErr) {
        console.error('Failed to update plan:', planErr)
        return NextResponse.json(
          { error: 'Failed to update plan.' },
          { status: 500 }
        )
      }
    }

    // Fetch and return the updated user
    const { data: updatedUser, error: fetchErr } = await supabase
      .from('users')
      .select('id, name, email, role, created_at, updated_at, is_suspended')
      .eq('id', id)
      .single()

    if (fetchErr || !updatedUser) {
      return NextResponse.json(
        { error: 'Failed to fetch updated user.' },
        { status: 500 }
      )
    }

    const result: Record<string, unknown> = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at,
      is_suspended: updatedUser.is_suspended ?? false,
    }

    // Attach plan if teacher
    if (updatedUser.role === 'teacher') {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('plan')
        .eq('id', id)
        .single()

      if (teacher) {
        result.plan = teacher.plan
      }
    }

    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('Admin user update error:', error)
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    )
  }
}
