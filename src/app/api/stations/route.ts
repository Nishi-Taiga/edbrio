import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const HEARTRAILS_BASE = 'https://express.heartrails.com/api/json'
const ALLOWED_METHODS = ['getPrefectures', 'getLines', 'getStations'] as const

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const method = searchParams.get('method')

  if (!method || !ALLOWED_METHODS.includes(method as typeof ALLOWED_METHODS[number])) {
    return NextResponse.json({ error: 'Invalid method' }, { status: 400 })
  }

  const upstreamParams = new URLSearchParams()
  upstreamParams.set('method', method)
  for (const key of ['prefecture', 'line', 'name']) {
    const val = searchParams.get(key)
    if (val) upstreamParams.set(key, val)
  }

  try {
    const res = await fetch(`${HEARTRAILS_BASE}?${upstreamParams.toString()}`, {
      next: { revalidate: 86400 },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream API error' }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json(data.response, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch station data' }, { status: 502 })
  }
}
