import { NextRequest } from 'next/server'

interface MockRequestOptions {
  method?: string
  body?: Record<string, unknown>
  headers?: Record<string, string>
  searchParams?: Record<string, string>
  url?: string
}

/**
 * Creates a NextRequest for API route testing.
 */
export function createMockRequest(options: MockRequestOptions = {}): NextRequest {
  const {
    method = 'GET',
    body,
    headers = {},
    searchParams = {},
    url = 'http://localhost:3000/api/test',
  } = options

  const urlObj = new URL(url)
  for (const [key, value] of Object.entries(searchParams)) {
    urlObj.searchParams.set(key, value)
  }

  const init: RequestInit = {
    method,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  }

  if (body && method !== 'GET') {
    init.body = JSON.stringify(body)
  }

  return new NextRequest(urlObj, init)
}

/**
 * Extracts JSON body and status from a NextResponse.
 */
export async function parseResponse(response: Response) {
  const status = response.status
  const body = await response.json()
  return { status, body }
}
