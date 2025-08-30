// src/app/api/area/suggest/route.ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server' // your server client (no cookies)

type SuggestParams = {
  city: string
  days: number
  budget: number // 1..5
  pace: 'relaxed' | 'balanced' | 'packed'
  interests: string[] // ['cafes','restaurants','bars','museums','galleries','architecture','nightlife',...]
}

type AreaStatsRow = {
  area_id: string
  city: string
  country: string
  area_name: string
  area_slug: string | null
  description: string | null
  vibe_tags: string[] | null
  image_url: string | null
  lat: number | null
  lng: number | null
  total_places: number
  avg_rating: number | null
  types_distinct: string[] | null
  themes_distinct: string[] | null
  median_price_level: number | null
}

// Map UI interests → place types/themes we consider a “match”
const INTEREST_TO_TYPES: Record<string, { types?: string[]; themes?: string[] }> = {
  cafes: { types: ['cafe', 'bakery'] },
  restaurants: { types: ['restaurant'] },
  bars: { types: ['bar', 'wine_bar', 'club'] },
  nightlife: { themes: ['nightlife'] },
  museums: { types: ['museum'] },
  galleries: { types: ['gallery'] },
  architecture: { themes: ['architecture'] },
  parks: { types: ['park', 'garden'] },
  walks: { types: ['neighborhood_walk', 'landmark'] },
  photo_spots: { themes: ['photo_spot'] },
}

function scoreArea(a: AreaStatsRow, prefs: SuggestParams) {
  const types = new Set(a.types_distinct ?? [])
  const themes = new Set(a.themes_distinct ?? [])

  // 1) Interest overlap (0..1)
  let interestHits = 0
  let interestTotal = 0
  for (const k of prefs.interests) {
    const map = INTEREST_TO_TYPES[k]
    if (!map) continue
    interestTotal += 1
    const hasType =
      map.types?.some((t) => types.has(t)) || false
    const hasTheme =
      map.themes?.some((t) => themes.has(t)) || false
    if (hasType || hasTheme) interestHits += 1
  }
  const interestScore = interestTotal ? interestHits / interestTotal : 0.3 // small prior

  // 2) Rating (normalize 0..1)
  const ratingScore = a.avg_rating ? Math.min(Math.max((Number(a.avg_rating) - 3.5) / 1.5, 0), 1) : 0.4

  // 3) Density (log normalize)
  const densityScore = Math.min(Math.log(1 + a.total_places) / Math.log(1 + 50), 1) // cap around 50

  // 4) Price mismatch penalty (0..1) subtracted
  const med = a.median_price_level ?? 3
  const priceMismatch = Math.min(Math.abs(med - prefs.budget) / 4, 1)

  // Weights (tweakable)
  const wI = 0.55
  const wR = 0.20
  const wD = 0.20
  const wP = 0.35

  const final = wI * interestScore + wR * ratingScore + wD * densityScore - wP * priceMismatch
  return Number(final.toFixed(4))
}

function pickBucket(types: string[] | null, themes: string[] | null) {
  const T = new Set(types ?? [])
  const H = new Set(themes ?? [])
  if (T.has('cafe') || T.has('bakery')) return 'cafes'
  if (T.has('restaurant') || T.has('wine_bar') || T.has('bar') || T.has('club')) return 'food_drink'
  if (T.has('museum')) return 'museums'
  if (T.has('gallery')) return 'galleries'
  if (T.has('park') || T.has('garden') || T.has('neighborhood_walk')) return 'outdoors'
  if (H.has('nightlife')) return 'nightlife'
  return 'other'
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const city = (url.searchParams.get('city') || '').trim()
    const days = Math.max(1, Number(url.searchParams.get('days') || '2'))
    const budget = Math.min(5, Math.max(1, Number(url.searchParams.get('budget') || '3')))
    const pace = (url.searchParams.get('pace') as SuggestParams['pace']) || 'balanced'
    const interests = (url.searchParams.get('interests') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    if (!city) {
      return NextResponse.json({ error: 'Missing city' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Pull area stats for the city
    const { data: stats, error: es } = await supabase
      .from('area_stats')
      .select('*')
      .ilike('city', city)

    if (es) throw es

    const prefs: SuggestParams = { city, days, budget, pace, interests }

    // Score, sort, pick top ~ 1.5 per day (min 1/day)
    const topCount = Math.max(days, Math.ceil(days * 1.5))
    const ranked = (stats ?? [])
      .map((a) => ({ a, score: scoreArea(a as AreaStatsRow, prefs) }))
      .sort((x, y) => y.score - x.score)
      .slice(0, topCount)

    // For each picked area, pull places & bucket them
    const areaDays: any[] = []
    for (const { a } of ranked) {
      const { data: places, error: ep } = await supabase
        .from('places')
        .select('id,name,description,lat,lng,types,themes,price_level,google_place_id,city')
        .eq('area_id', (a as AreaStatsRow).area_id)
        .eq('status', 'active')
        .limit(80)
      if (ep) throw ep

      const buckets: Record<string, any[]> = {
        cafes: [],
        food_drink: [],
        museums: [],
        galleries: [],
        outdoors: [],
        nightlife: [],
        other: [],
      }

      for (const p of places ?? []) {
        const b = pickBucket(p.types, p.themes)
        // simple preference-aware sort key: closer to budget, prefer higher rating if present
        buckets[b].push({
          ...p,
          google_url: p.google_place_id
            ? `https://www.google.com/maps/place/?q=place_id:${p.google_place_id}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name} ${p.city}`)}`,
        })
      }

      // Small “top few” per bucket for UI
      const limit = 4
      const slots = {
        cafes: buckets.cafes.slice(0, limit),
        food_drink: buckets.food_drink.slice(0, limit),
        museums: buckets.museums.slice(0, limit),
        galleries: buckets.galleries.slice(0, limit),
        outdoors: buckets.outdoors.slice(0, limit),
        nightlife: buckets.nightlife.slice(0, limit),
        other: buckets.other.slice(0, limit),
      }

      const area = a as AreaStatsRow
      areaDays.push({
        area: {
          id: area.area_id,
          name: area.area_name,
          slug: area.area_slug,
          imageUrl: area.image_url,
          center: [area.lat, area.lng],
          vibe: area.vibe_tags ?? [],
          description: area.description,
        },
        summary: `Explore ${area.area_name} — great for ${[...(area.vibe_tags ?? [])].slice(0, 3).join(', ') || 'walking, cafés and culture'}.`,
        slots,
      })
    }

    // Group into days (1–2 areas/day)
    const perDay = days
    const grouped: any[] = []
    let i = 0
    for (let d = 0; d < perDay; d++) {
      grouped.push(areaDays.slice(i, i + 2))
      i += 2
    }

    return NextResponse.json({
      city,
      days,
      areasRanked: ranked.map(({ a, score }) => ({
        id: (a as any).area_id,
        name: (a as any).area_name,
        score,
      })),
      dayGroups: grouped, // [ [ areaDay, areaDay? ], ... ]
    })
  } catch (e: any) {
    console.error('suggest/area error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}