import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

// ── Login attempt tracking (in-memory, resets on deploy) ──
interface LoginAttempt {
  count: number
  lockedUntil: number | null
}
const loginAttempts = new Map<string, LoginAttempt>()
const MAX_LOGIN_ATTEMPTS = 10
const LOCKOUT_DURATION_MS = 30 * 60 * 1000 // 30 minutes

export function checkLoginLock(identifier: string): { locked: boolean; remaining: number } {
  const entry = loginAttempts.get(identifier)
  if (!entry) return { locked: false, remaining: MAX_LOGIN_ATTEMPTS }

  // Check if lockout has expired
  if (entry.lockedUntil && Date.now() > entry.lockedUntil) {
    loginAttempts.delete(identifier)
    return { locked: false, remaining: MAX_LOGIN_ATTEMPTS }
  }

  if (entry.lockedUntil) return { locked: true, remaining: 0 }

  return { locked: false, remaining: MAX_LOGIN_ATTEMPTS - entry.count }
}

export function recordLoginFailure(identifier: string): { locked: boolean } {
  const entry = loginAttempts.get(identifier) || { count: 0, lockedUntil: null }
  entry.count++

  if (entry.count >= MAX_LOGIN_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION_MS
    loginAttempts.set(identifier, entry)
    return { locked: true }
  }

  loginAttempts.set(identifier, entry)
  return { locked: false }
}

export function clearLoginAttempts(identifier: string) {
  loginAttempts.delete(identifier)
}

// ── Basic auth for admin routes ──
function checkBasicAuth(request: NextRequest): NextResponse | null {
  const adminUser = process.env.ADMIN_BASIC_AUTH_USER?.trim()
  const adminPass = process.env.ADMIN_BASIC_AUTH_PASS?.trim()

  // If basic auth is not configured, block admin access entirely
  if (!adminUser || !adminPass) {
    return new NextResponse('Admin access is not configured', { status: 403 })
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Basic ')) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="EdBrio Admin"' },
    })
  }

  const base64Credentials = authHeader.slice(6)
  const decoded = atob(base64Credentials)
  const colonIndex = decoded.indexOf(':')
  const user = decoded.slice(0, colonIndex)
  const pass = decoded.slice(colonIndex + 1)

  if (user !== adminUser || pass !== adminPass) {
    return new NextResponse('Invalid credentials', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="EdBrio Admin"' },
    })
  }

  return null // Auth passed
}

// ── Security headers ──
function addSecurityHeaders(response: NextResponse): NextResponse {
  // HSTS - force HTTPS
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  // Permissions policy
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  // CSP
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.anthropic.com https://api.resend.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  )
  return response
}

// ── Main middleware ──
export const updateSession = async (request: NextRequest, existingResponse?: NextResponse) => {
  const { pathname } = request.nextUrl

  // Basic auth for admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const authResult = checkBasicAuth(request)
    if (authResult) return authResult
  }

  // Use existing response (e.g. from next-intl middleware) or create new one
  let response = existingResponse ?? NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Skip Supabase client creation during build if env vars are missing
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return addSecurityHeaders(response)
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // Preserve existing response if provided, otherwise create new
          if (!existingResponse) {
            response = NextResponse.next({
              request,
            })
          }
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // refreshing the auth token
  await supabase.auth.getUser()

  return addSecurityHeaders(response)
}
