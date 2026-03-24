import { NextRequest, NextResponse } from 'next/server'
import { preRegisterConfirmSchema } from '@/lib/validations'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || ''

  const result = preRegisterConfirmSchema.safeParse({ token })
  if (!result.success) {
    return NextResponse.redirect(new URL('/?confirmed=error', req.url))
  }

  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('pre_registrations')
      .update({ confirmed_at: new Date().toISOString() })
      .eq('token', result.data.token)
      .is('confirmed_at', null)

    if (error) {
      console.error('Pre-registration confirm error:', error.message)
      return NextResponse.redirect(new URL('/?confirmed=error', req.url))
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://edbrio.com'
    return NextResponse.redirect(new URL('/?confirmed=true', appUrl))
  } catch (error: unknown) {
    console.error('Pre-registration confirm error:', error instanceof Error ? error.message : error)
    return NextResponse.redirect(new URL('/?confirmed=error', req.url))
  }
}
