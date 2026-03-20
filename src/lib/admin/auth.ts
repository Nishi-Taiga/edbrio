import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export type AdminAuthResult =
  | { ok: true; adminId: string; adminEmail: string }
  | { ok: false; response: NextResponse }

/**
 * Admin API ルート用の二重認証チェック。
 * 1. Supabase セッションの有効性を検証
 * 2. ADMIN_ALLOWED_EMAILS 環境変数のホワイトリストと照合
 *
 * ミドルウェアの Basic Auth が突破された場合でも、
 * この関数がセカンドレイヤーとして機能する。
 */
export async function verifyAdminRequest(): Promise<AdminAuthResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  if (allowedEmails.length === 0) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Admin access not configured' },
        { status: 403 }
      ),
    }
  }

  if (!allowedEmails.includes(user.email?.toLowerCase() ?? '')) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return { ok: true, adminId: user.id, adminEmail: user.email! }
}
