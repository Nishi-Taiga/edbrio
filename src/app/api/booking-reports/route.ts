import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// POST: 保護者が問題報告を作成
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { bookingId, reason, description } = body

    if (!bookingId || !reason) {
      return NextResponse.json({ error: 'bookingId and reason are required' }, { status: 400 })
    }

    if (!['late', 'absent', 'other'].includes(reason)) {
      return NextResponse.json({ error: 'Invalid reason' }, { status: 400 })
    }

    if (reason === 'other' && !description?.trim()) {
      return NextResponse.json({ error: 'Description is required for "other" reason' }, { status: 400 })
    }

    // Verify the booking belongs to this guardian's student
    const { data: students } = await supabase
      .from('students')
      .select('id')
      .eq('guardian_id', user.id)

    if (!students || students.length === 0) {
      return NextResponse.json({ error: 'No students found' }, { status: 403 })
    }

    const studentIds = students.map(s => s.id)

    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('id, student_id, start_time')
      .eq('id', bookingId)
      .in('student_id', studentIds)
      .single()

    if (bErr || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check that lesson start time has passed
    if (new Date(booking.start_time) > new Date()) {
      return NextResponse.json({ error: 'Cannot report before lesson starts' }, { status: 400 })
    }

    // Check for existing pending report on this booking
    const { data: existing } = await supabase
      .from('booking_reports')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('status', 'pending')
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'A pending report already exists for this booking' }, { status: 409 })
    }

    // Create the report with 3-day deadline
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + 3)

    const { data: report, error: rErr } = await supabase
      .from('booking_reports')
      .insert({
        booking_id: bookingId,
        reporter_id: user.id,
        reason,
        description: description?.trim() || null,
        deadline: deadline.toISOString(),
      })
      .select()
      .single()

    if (rErr) {
      console.error('Failed to create booking report:', rErr)
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Booking report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: 講師が自分の予約に紐づく報告を取得
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = req.nextUrl.searchParams.get('status')

    // Get all bookings for this teacher
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('teacher_id', user.id)

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ reports: [] })
    }

    const bookingIds = bookings.map(b => b.id)

    let query = supabase
      .from('booking_reports')
      .select('*')
      .in('booking_id', bookingIds)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: reports, error: rErr } = await query

    if (rErr) {
      console.error('Failed to fetch booking reports:', rErr)
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    return NextResponse.json({ reports: reports || [] })
  } catch (error) {
    console.error('Booking reports fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
