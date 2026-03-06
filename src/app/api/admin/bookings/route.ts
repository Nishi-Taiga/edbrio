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
    const status = searchParams.get('status')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)))

    if (type === 'stats') {
      const now = new Date()
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()

      const [
        totalBookingsRes,
        monthBookingsRes,
        statusRes,
        availabilityRes,
        bookedRes,
      ] = await Promise.all([
        // Total bookings
        supabase.from('bookings').select('*', { count: 'exact', head: true }),

        // Bookings this month
        supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart),

        // All bookings for status breakdown
        supabase.from('bookings').select('status'),

        // Availability slots per teacher
        supabase.from('availability').select('teacher_id'),

        // Booked slots per teacher (confirmed or done)
        supabase
          .from('bookings')
          .select('teacher_id')
          .in('status', ['confirmed', 'done']),
      ])

      // Status breakdown
      const byStatus: Record<string, number> = {
        pending: 0,
        confirmed: 0,
        canceled: 0,
        done: 0,
      }
      if (statusRes.data) {
        for (const b of statusRes.data) {
          const s = b.status as string
          if (s in byStatus) {
            byStatus[s]++
          }
        }
      }

      const totalBookings = totalBookingsRes.count ?? 0
      const cancelRate =
        totalBookings > 0
          ? Math.round((byStatus.canceled / totalBookings) * 10000) / 100
          : 0

      // Utilization per teacher
      const teacherSlots = new Map<string, number>()
      if (availabilityRes.data) {
        for (const a of availabilityRes.data) {
          if (a.teacher_id) {
            teacherSlots.set(a.teacher_id, (teacherSlots.get(a.teacher_id) || 0) + 1)
          }
        }
      }

      const teacherBooked = new Map<string, number>()
      if (bookedRes.data) {
        for (const b of bookedRes.data) {
          if (b.teacher_id) {
            teacherBooked.set(b.teacher_id, (teacherBooked.get(b.teacher_id) || 0) + 1)
          }
        }
      }

      // Get all unique teacher IDs
      const allTeacherIds = [...new Set([...teacherSlots.keys(), ...teacherBooked.keys()])]

      // Resolve teacher names
      const teacherNameMap = new Map<string, string>()
      if (allTeacherIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, name')
          .in('id', allTeacherIds)
        if (users) {
          for (const u of users) {
            teacherNameMap.set(u.id, u.name)
          }
        }
      }

      const utilization = allTeacherIds.map((teacherId) => {
        const totalSlots = teacherSlots.get(teacherId) || 0
        const bookedSlots = teacherBooked.get(teacherId) || 0
        const rate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 10000) / 100 : 0
        return {
          teacher_id: teacherId,
          teacher_name: teacherNameMap.get(teacherId) || 'Unknown',
          total_slots: totalSlots,
          booked_slots: bookedSlots,
          rate,
        }
      })

      return NextResponse.json({
        totalBookings,
        monthBookings: monthBookingsRes.count ?? 0,
        byStatus,
        cancelRate,
        utilization,
      })
    }

    // type === 'list'
    const offset = (page - 1) * limit

    let countQuery = supabase.from('bookings').select('*', { count: 'exact', head: true })
    let dataQuery = supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      countQuery = countQuery.eq('status', status)
      dataQuery = dataQuery.eq('status', status)
    }
    if (from) {
      countQuery = countQuery.gte('created_at', from)
      dataQuery = dataQuery.gte('created_at', from)
    }
    if (to) {
      countQuery = countQuery.lte('created_at', to)
      dataQuery = dataQuery.lte('created_at', to)
    }

    const [countRes, dataRes] = await Promise.all([countQuery, dataQuery])

    const bookings = dataRes.data ?? []

    // Resolve teacher and student names
    const userIds = [
      ...new Set([
        ...bookings.map((b) => b.teacher_id).filter(Boolean),
        ...bookings.map((b) => b.student_id).filter(Boolean),
      ]),
    ]

    const userNameMap = new Map<string, string>()
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, name')
        .in('id', userIds)
      if (users) {
        for (const u of users) {
          userNameMap.set(u.id, u.name)
        }
      }
    }

    const enrichedBookings = bookings.map((b) => ({
      ...b,
      teacher_name: userNameMap.get(b.teacher_id) || null,
      student_name: userNameMap.get(b.student_id) || null,
    }))

    return NextResponse.json({
      bookings: enrichedBookings,
      total: countRes.count ?? 0,
      page,
      limit,
    })
  } catch (error: unknown) {
    console.error('Admin bookings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch booking data' },
      { status: 500 }
    )
  }
}
