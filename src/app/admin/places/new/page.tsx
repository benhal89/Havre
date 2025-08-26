import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Types shared with the client
export type Activity = {
  time?: string
  title: string
  details?: string
  mapUrl?: string
  tags?: string[]
  lat?: number
  lng?: number
}
export type DayPlan = { date?: string; activities: Activity[] }
export type Itinerary = { days: DayPlan[]; notes?: string }

function parseBodyDates(dates?: string | null) {
  // expects "YYYY-MM-DD to YYYY-MM-DD" but is optional
  if (!dates) return { start: null as Date | null, end: null as Date | null, days: 3 }
  try {
    const [a, b] = String(dates).split(' to ')
    const start = new Date(a)
    const end = new Date(b)
    const diff = Math.max(1, Math.round((+end - +start) / 86400000) + 1)
    return { start, end, days: isFinite(diff) ? diff : 3 }
  } catch {
    return { start: null as Date | null, end: null as Date | null, days: 3 }
  }
}

function buildGoogleUrl(name: string, lat?: number, lng?: number) {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=&query=${encodeURIComponent(`${name} ${lat},${lng}`)}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const destination: string = body?.destination || 'Paris'
    const dates: string | undefined = body?.dates
    const { days } = parseBodyDates(dates)

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !anon) {
      // Return JSON (don’t throw HTML)
      return NextResponse.json(
        { error: 'Supabase env missing (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)' },
        { status: 500 }
      )
    }

    const supabase = createClient(url, anon, { auth: { persistSession: false } })

    // Basic place query – keep it permissive; your RLS must allow anon read of active places
    const { data, error } = await supabase
      .from('places')
      .select('name, description, lat, lng, types, city, address, website')
      .eq('status', 'active')
      .ilike('city', destination)
      .limit(60)

    // If the DB call fails, we’ll fall back to a tiny, hard‑coded sample so the UI continues to work
    const places = (!error && Array.isArray(data) && data.length ? data : [
      { name: 'Musée d’Orsay', description: 'Impressionist treasures on the Seine.', lat: 48.8600, lng: 2.3266, types: ['museum'] },
      { name: 'Le Marais stroll', description: 'Shops and cafés in historic streets.', lat: 48.8586, lng: 2.3581, types: ['neighborhood_walk'] },
      { name: 'Bistro Amour', description: 'Natural wine & seasonal plates.', lat: 48.8712, lng: 2.3453, types: ['restaurant','wine_bar'] },
      { name: 'Parc des Buttes‑Chaumont', description: 'Dramatic park with views.', lat: 48.8809, lng: 2.3819, types: ['park'] },
      { name: 'Belvédère République', description: 'Evening viewpoint.', lat: 48.8670, lng: 2.3630, types: ['landmark'] },
    ]) as any[]

    // Very simple splitter: ~5 stops per day, sequential order as returned
    const perDay = Math.max(3, Math.min(6, Math.round(places.length / Math.max(1, days))))

    const dayPlans: DayPlan[] = []
    for (let d = 0; d < days; d++) {
      const slice = places.slice(d * perDay, (d + 1) * perDay)
      const activities: Activity[] = slice.map((p, i) => ({
        time: `${String(9 + i * 2).padStart(2, '0')}:30`,
        title: p.name,
        details: p.description || null || undefined,
        mapUrl: buildGoogleUrl(p.name, p.lat, p.lng),
        tags: Array.isArray(p.types) ? p.types : [],
        lat: typeof p.lat === 'number' ? p.lat : undefined,
        lng: typeof p.lng === 'number' ? p.lng : undefined,
      }))
      if (activities.length) dayPlans.push({ activities })
    }

    if (!dayPlans.length) {
      // ensure at least one day so the UI renders
      dayPlans.push({ activities: [{ title: 'Explore the city', details: 'Walk, café stops, and a viewpoint.', tags: ['walk'] }] })
    }

    const payload: Itinerary = {
      days: dayPlans,
      notes: 'Auto‑generated selection. Refine on the home page and Regenerate to update.'
    }

    return NextResponse.json(payload)
  } catch (e: any) {
    // Always end with JSON so the client never sees HTML error pages
    return NextResponse.json({ error: e?.message || 'itinerary failed' }, { status: 500 })
  }
}