// src/app/api/areas/suggest/route.ts
import { NextResponse } from 'next/server'
import { pickAreasByDensity } from '@/lib/scoring'

type Payload = {
  city: string
  interests?: string[]
  limit?: number
}

/**
 * POST /api/areas/suggest
 * body: { city: "Paris", interests?: ["cafes","museums"], limit?: 3 }
 * -> { areas: Area[] }
 */
export async function POST(req: Request) {
  let body: Payload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const city = body.city?.trim()
  const interests = body.interests ?? []
  const limit = body.limit ?? 3

  if (!city) {
    return NextResponse.json({ error: 'city is required' }, { status: 400 })
  }

  const areas = await pickAreasByDensity(city, interests, limit)
  return NextResponse.json({ areas })
}

/**
 * GET /api/areas/suggest?city=Paris&interests=cafes,museums&limit=3
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const city = searchParams.get('city')?.trim() || ''
  const interests = (searchParams.get('interests') || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  const limit = Number(searchParams.get('limit') || 3)

  if (!city) {
    return NextResponse.json({ error: 'city is required' }, { status: 400 })
  }

  const areas = await pickAreasByDensity(city, interests, isFinite(limit) ? limit : 3)
  return NextResponse.json({ areas })
}