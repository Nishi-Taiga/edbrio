import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/login'
  const role = searchParams.get('role') as 'teacher' | 'guardian' | null
  const inviteToken = searchParams.get('inviteToken')

  if (!code) {
    return NextResponse.redirect(new URL('/login', origin))
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Auth callback error:', error.message)
    return NextResponse.redirect(new URL('/login', origin))
  }

  // Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', origin))
  }

  // Check if this is an OAuth login (Google, etc.)
  const isOAuth = user.app_metadata?.provider !== 'email'

  if (isOAuth) {
    const admin = createAdminClient()

    // Check if the user already exists in public.users
    const { data: existingUser } = await admin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (existingUser) {
      // Existing user — redirect based on their DB role
      const redirectPath = existingUser.role === 'guardian'
        ? '/guardian/dashboard'
        : existingUser.role === 'admin'
          ? '/admin/dashboard'
          : '/teacher/dashboard'
      return NextResponse.redirect(new URL(redirectPath, origin))
    }

    // New OAuth user — the DB trigger already created a row with defaults.
    // We need to fix: role, name, and role-specific table.
    const selectedRole = role || 'guardian'
    const googleName = user.user_metadata?.full_name
      || user.user_metadata?.name
      || user.email?.split('@')[0]
      || 'User'

    // Update user metadata so it's consistent
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        role: selectedRole,
        name: googleName,
      },
    })

    // Update public.users row (created by trigger with defaults)
    await admin
      .from('users')
      .update({ role: selectedRole, name: googleName })
      .eq('id', user.id)

    // Create role-specific table row if missing
    if (selectedRole === 'teacher') {
      const { data: existingTeacher } = await admin
        .from('teachers')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingTeacher) {
        await admin.from('teachers').insert({
          id: user.id,
          plan: 'free',
          is_setup_complete: false,
        })
      }
    } else if (selectedRole === 'guardian') {
      const { data: existingGuardian } = await admin
        .from('guardians')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingGuardian) {
        await admin.from('guardians').insert({
          id: user.id,
        })
      }
    }

    // If there's an invite token, redirect to the invite page
    if (inviteToken) {
      return NextResponse.redirect(new URL(`/invite/${inviteToken}`, origin))
    }

    // Redirect new user to appropriate dashboard
    const redirectPath = selectedRole === 'guardian'
      ? '/guardian/dashboard'
      : '/teacher/dashboard'
    return NextResponse.redirect(new URL(redirectPath, origin))
  }

  // Non-OAuth (email) — just redirect to next
  return NextResponse.redirect(new URL(next, origin))
}
