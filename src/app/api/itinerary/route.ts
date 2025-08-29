import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) as string
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

type Place = {
  id: string
  name: string
  lat: number
  lng: number
  address: string | null
  city: string
  country: string
  types: string[] | null
  tags: string[] | null
  themes: string[] | null
  price_level: number | null
  description: string | null
}

type ItinActivity = {
  time?: string
  title: string
  description?: string
  lat?: number
  lng?: number
  address?: string | null
}

type DayPlan = { date?: string; activities: ItinActivity[] }
type Itinerary = { days: DayPlan[] }

const TYPE_MAP: Record<string, string[]> = {
  // map your UI interests into place.types
  cafes: ['cafe', 'bakery'],
  restaurants: ['restaurant'],
  bars: ['bar', 'wine_bar', 'club'],
  museums: ['museum'],
  galleries: ['gallery'],
  architecture: ['landmark', 'theatre'],
  live_music: ['event_venue'],
  parties: ['club'],
  nightlife: ['bar', 'club', 'rooftop'],
  parks: ['park', 'garden'],
  walks: ['neighborhood_walk', 'lookout'],
  sports: ['hike', 'beach'],
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      destination,
      city,
      country,
      days = 3,
      pace = 'balanced',
      budget = '3',
      interests = [],
    }: {
      destination?: string
      city?: string
      country?: string
      days?: number
      pace?: 'relaxed' | 'balanced' | 'packed' | string
      budget?: string | number
      interests?: string[]
    } = body || {}

    const wantedCity = (city || destination || '').trim()
    if (!wantedCity) {
      return NextResponse.json({ error: 'No city provided' }, { status: 400 })
    }

    // expand UI interests into DB types
    const typeFilters: string[] = (interests || []).flatMap((t: string) => TYPE_MAP[t] || [])

    let query = supabase
      .from('places')
      .select(
        'id,name,lat,lng,address,city,country,types,tags,themes,price_level,description',
      )
      .eq('status', 'active')
      .ilike('city', wantedCity)

    if (country) {
      query = query.eq('country', country)
    }
    if (typeFilters.length > 0) {
      query = query.overlaps('types', typeFilters)
    }

    // basic prioritization: price band ±1, and sample a reasonable number
    const { data: places, error } = await query.limit(60)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const filtered: Place[] = (places || []).filter((p: Place) => {
      if (p.price_level == null) return true
      const b = Number(budget) || 3
      return Math.abs(p.price_level - b) <= 1
    })

    // choose number of stops per day by pace
    const perDay =
      pace === 'relaxed' ? 4 : pace === 'packed' ? 8 : 6

    // naive scoring: prefer rows that match more types
    const scored = filtered
      .map((p: Place) => {
        const score =
          (p.types || []).reduce((acc: number, t: string) => acc + (typeFilters.includes(t) ? 2 : 0), 0) +
          (p.tags || []).reduce((acc: number, t: string) => acc + (interests.includes(t) ? 1 : 0), 0)
        return { p, score }
      })
      .sort((a, b) => b.score - a.score)
      .map(({ p }) => p)

    // chunk into days
    const totalNeeded = perDay * Math.max(1, Math.min(14, days))
    const chosen = scored.slice(0, totalNeeded)

    const daysArr: DayPlan[] = []
    for (let d = 0; d < Math.max(1, Math.min(14, days)); d++) {
      const slice = chosen.slice(d * perDay, (d + 1) * perDay)
      const activities: ItinActivity[] = slice.map((p: Place, i: number) => ({
        time: `${9 + i}:00`,
        title: p.name,
        description: p.description || undefined,
        lat: p.lat,
        lng: p.lng,
        address: p.address,
      }))
      daysArr.push({ activities })
    }

    const itinerary: Itinerary = { days: daysArr }
    return NextResponse.json(itinerary)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to build itinerary' }, { status: 500 })
  }
}