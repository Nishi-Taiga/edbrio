/**
 * HTTP client for security testing
 * Makes real requests to the local dev server
 */

import { BASE_URL } from './constants'

interface FetchOptions extends RequestInit {
  /** Skip JSON content-type header */
  raw?: boolean
}

/**
 * Base fetch wrapper for security tests
 * Always targets localhost dev server
 */
export async function secFetch(
  path: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { raw, ...fetchOptions } = options
  const url = `${BASE_URL}${path}`

  const headers: Record<string, string> = {
    ...(raw ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> || {}),
  }

  return fetch(url, {
    ...fetchOptions,
    headers,
    redirect: 'manual', // Don't follow redirects — inspect them
  })
}

/**
 * Login via Supabase auth and extract session cookies
 * Returns cookie string for use in subsequent requests
 */
export async function loginAndGetCookies(
  email: string,
  password: string
): Promise<string> {
  // First call the login API to validate and get through lockout
  const loginRes = await secFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

  if (!loginRes.ok) {
    throw new Error(`Login API failed: ${loginRes.status} ${await loginRes.text()}`)
  }

  // Extract all set-cookie headers
  const cookies = loginRes.headers.getSetCookie?.() || []
  return cookies.join('; ')
}

/**
 * Authenticated fetch — sends session cookies
 */
export async function authedFetch(
  path: string,
  cookies: string,
  options: FetchOptions = {}
): Promise<Response> {
  return secFetch(path, {
    ...options,
    headers: {
      ...(options.headers as Record<string, string> || {}),
      Cookie: cookies,
    },
  })
}

/**
 * Make a fetch with spoofed IP via X-Forwarded-For
 * Used to test rate limit bypass
 */
export async function spoofedIpFetch(
  path: string,
  spoofedIp: string,
  options: FetchOptions = {}
): Promise<Response> {
  return secFetch(path, {
    ...options,
    headers: {
      ...(options.headers as Record<string, string> || {}),
      'X-Forwarded-For': spoofedIp,
    },
  })
}

/**
 * Make a fetch with Basic Auth header (for admin routes)
 */
export async function basicAuthFetch(
  path: string,
  username: string,
  password: string,
  options: FetchOptions = {}
): Promise<Response> {
  const credentials = Buffer.from(`${username}:${password}`).toString('base64')
  return secFetch(path, {
    ...options,
    headers: {
      ...(options.headers as Record<string, string> || {}),
      Authorization: `Basic ${credentials}`,
    },
  })
}

/**
 * Rapid-fire requests to test rate limiting
 * Returns array of status codes
 */
export async function rapidFire(
  path: string,
  count: number,
  options: FetchOptions = {}
): Promise<number[]> {
  const results: number[] = []
  for (let i = 0; i < count; i++) {
    const res = await secFetch(path, options)
    results.push(res.status)
  }
  return results
}

/**
 * Generate a random IP for spoofing tests
 */
export function randomIp(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
}
