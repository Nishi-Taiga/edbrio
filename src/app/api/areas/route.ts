import { NextResponse } from 'next/server'

const GEOLONIA_URL = 'https://geolonia.github.io/japanese-addresses/api/ja.json'

export async function GET() {
  try {
    const res = await fetch(GEOLONIA_URL, {
      next: { revalidate: 86400 },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream API error' }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch area data' }, { status: 502 })
  }
}
