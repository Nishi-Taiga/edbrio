import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  checkLoginLock,
  recordLoginFailure,
  clearLoginAttempts,
} from '@/lib/supabase/middleware'
import { createRateLimiter } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// Rate limit: 20 login attempts per minute per IP
const loginRateLimiter = createRateLimiter({ windowMs: 60_000, max: 20 })

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  // IP-level rate limiting
  const { success: rateLimitOk } = loginRateLimiter.check(ip)
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: 'リクエストが多すぎます。しばらくしてからお試しください。' },
      { status: 429 }
    )
  }

  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json(
      { error: 'メールアドレスとパスワードを入力してください。' },
      { status: 400 }
    )
  }

  // Check account lockout (by email)
  const lockKey = email.toLowerCase()
  const { locked } = checkLoginLock(lockKey)
  if (locked) {
    return NextResponse.json(
      { error: 'アカウントがロックされています。30分後に再度お試しください。' },
      { status: 423 }
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Record failed attempt
    const { locked: nowLocked } = recordLoginFailure(lockKey)
    const message = nowLocked
      ? 'ログイン試行回数の上限に達しました。アカウントが30分間ロックされます。'
      : 'メールアドレスまたはパスワードが正しくありません。'
    return NextResponse.json({ error: message }, { status: 401 })
  }

  // Successful login — clear failed attempts
  clearLoginAttempts(lockKey)

  // Get user role for redirect
  const { data: dbUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single()

  const role = dbUser?.role || data.user.user_metadata?.role || 'teacher'

  return NextResponse.json({ role })
}
