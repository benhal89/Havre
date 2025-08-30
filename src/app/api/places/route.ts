import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export type Place = {
  id: string
  name: string
  description: string | null
  address: string | null
  city: string
  country: string
  lat: number
  lng: number
  tags: string[] | null
  types: string[] | null
  themes: string[] | null
  google_place_id: string | null
  website: string | null
}

function googleUrl(p: Place) {
  if (p.google_place_id) {
    return `https://www.google.com/maps/place/?q=place_id:${p.google_place_id}`
  }
  const q = encodeURIComponent(`${p.name} ${p.city}`)
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}

// quick fisher-yates shuffle
function shuffle<T>(arr: T[]) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * GET /api/places?city=Paris&types=restaurant,cafe&vibes=date_night,design&limit=12
 *
 * - If no filters given, returns a randomized slice for the city (default Paris).
 * - Filters:
 *   - types -> overlaps with "types" column (ANY)
 *   - vibes -> overlaps with "themes" column (ANY)
 */
export async function GET(req: Request) {
  const supabase = createServerClient()
  const url = new URL(req.url)

  const city = (url.searchParams.get('city') || 'Paris').trim()
  const typesParam = url.searchParams.get('types') || ''
  const vibesParam = url.searchParams.get('vibes') || ''
  const limit = Math.min(24, Math.max(1, Number(url.searchParams.get('limit') || 12)))

  const types = typesParam
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  const vibes = vibesParam
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  let q = supabase
    .from('places')
    .select(
      'id,name,description,address,city,country,lat,lng,tags,types,themes,google_place_id,website,status'
    )
    .eq('city', city)
    .eq('status', 'active')

  if (types.length > 0) {
    // ANY overlap with requested types
    // @ts-ignore Supabase type defs don’t include 'overlaps' string literal
    q = q.overlaps('types', types)
  }

  if (vibes.length > 0) {
    // ANY overlap with requested themes
    // @ts-ignore
    q = q.overlaps('themes', vibes)
  }

  const { data, error } = await q.limit(200)
  if (error) {
    console.error('Supabase error /api/places:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (data || []) as (Place & { status?: string })[]

  // If nothing found, try loosening by removing theme filters (common case)
  let results = rows
  if (results.length === 0 && (types.length > 0 || vibes.length > 0)) {
    let fallback = supabase
      .from('places')
      .select(
        'id,name,description,address,city,country,lat,lng,tags,types,themes,google_place_id,website,status'
      )
      .eq('city', city)
      .eq('status', 'active')

    if (types.length > 0) {
      // @ts-ignore
      fallback = fallback.overlaps('types', types)
    }

    const fb = await fallback.limit(200)
    if (!fb.error && fb.data) results = fb.data as any
  }

  // If still nothing, fetch random from city (no filters) so UI is never empty
  if (results.length === 0) {
    const any = await supabase
      .from('places')
      .select(
        'id,name,description,address,city,country,lat,lng,tags,types,themes,google_place_id,website,status'
      )
      .eq('city', city)
      .eq('status', 'active')
      .limit(200)

    if (!any.error && any.data) {
      results = any.data as any
    }
  }

  // Shuffle then slice to requested limit
  const final = shuffle(results).slice(0, limit).map((p) => ({
    ...p,
    google_url: googleUrl(p),
  }))

  return NextResponse.json({ city, count: final.length, places: final })
}