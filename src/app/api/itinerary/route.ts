// src/app/api/itinerary/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

type Payload = {
  destination?: string
  prompt?: string
  days?: number
  pace?: 'relaxed' | 'balanced' | 'packed'
  budget?: '1' | '2' | '3' | '4' | '5' | string
  wake?: 'early' | 'standard' | 'late'
  interests?: string[] // e.g. ['cafes','museums','parties']
  style?: string | null
}

function getSupabaseServer() {
  const cookieStore = cookies() // Next 15: sync accessor

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options?: Parameters<typeof cookieStore.set>[1]) =>
          cookieStore.set(name, value, options),
        remove: (name: string, options?: Parameters<typeof cookieStore.set>[1]) =>
          cookieStore.set(name, '', { ...options, expires: new Date(0) }),
      },
    }
  )
}

// very light scoring helper
function scorePlace(p: any, payload: Payload) {
  let s = 0

  // tag match
  const tags: string[] = Array.isArray(p.tags) ? p.tags : []
  const wants = new Set((payload.interests || []).map((t) => t.toLowerCase()))
  tags.forEach((t) => {
    if (wants.has(String(t).toLowerCase())) s += 3
  })

  // budget proximity (if place has price_level 1..5)
  const sel = Number(payload.budget || 3)
  const lvl = Number(p.price_level || 3)
  const dist = Math.abs(sel - lvl)
  s += Math.max(0, 3 - dist) // 3..0

  // tiny boost for “featured”/rating if present
  if (p.rating) s += Math.min(1.5, Number(p.rating) / 5)

  return s
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServer()

    const body: Payload = await req.json().catch(() => ({}))
    const destination = (body.destination || 'Paris').trim()
    const days = Math.min(Math.max(Number(body.days || 3), 1), 21)
    const pace = (body.pace as Payload['pace']) || 'balanced'
    const budget = String(body.budget || '3')
    const wake = (body.wake as Payload['wake']) || 'standard'
    const interests = Array.isArray(body.interests) ? body.interests : []
    const style = body.style ?? null
    const prompt = body.prompt || ''

    // 1) Persist request
    const { data: inserted, error: insertErr } = await supabase
      .from('requests')
      .insert([
        {
          destination,
          prompt,
          days,
          pace,
          budget,
          wake,
          interests,
          style,
        },
      ])
      .select('id')
      .single()

    if (insertErr) {
      console.error('insert request error', insertErr)
      // not fatal for itinerary; continue
    }

    // 2) Fetch candidate places (filter by destination if you store city/area)
    // Adjust these columns to match your schema (city/area/tags/price_level/rating/lat/lng/title)
    const { data: places, error: placesErr } = await supabase
      .from('places')
      .select('id,title,city,area,tags,price_level,rating,lat,lng,address,category')
      // .ilike('city', `%${destination}%`) // enable if you keep a city column
      .limit(300)

    if (placesErr) {
      console.error('fetch places error', placesErr)
    }

    const cand = (places || []).map((p) => ({
      ...p,
      _score: scorePlace(p, { destination, days, pace, budget, wake, interests, style, prompt }),
    }))

    // 3) Build itinerary: stops/day based on pace
    const stopsPerDay = pace === 'packed' ? 6 : pace === 'relaxed' ? 3 : 4
    const sorted = cand.sort((a, b) => b._score - a._score)

    let idx = 0
    const daysOut: Array<{
      day: number
      activities: Array<{
        title: string
        time?: string
        lat?: number
        lng?: number
        address?: string
        place_id?: string
        category?: string
      }>
    }> = []

    for (let d = 1; d <= days; d++) {
      const activities: any[] = []
      for (let i = 0; i < stopsPerDay && idx < sorted.length; i++, idx++) {
        const p = sorted[idx]
        activities.push({
          title: p.title || p.name || 'Place',
          time: '—',
          lat: p.lat ?? null,
          lng: p.lng ?? null,
          address: p.address ?? null,
          place_id: p.id,
          category: p.category ?? null,
        })
      }
      daysOut.push({ day: d, activities })
    }

    // 4) Adjust start/end by wake preference (very simple placeholder)
    // You can expand this later to add concrete times.
    const rhythmOffset = wake === 'early' ? -1 : wake === 'late' ? +2 : 0
    // (offset not applied to times yet; keep placeholder for now)

    // 5) Return response
    return NextResponse.json({
      id: inserted?.id ?? null,
      destination,
      days: daysOut,
      meta: { pace, budget, wake, interests, style, rhythmOffset },
    })
  } catch (e: any) {
    console.error('itinerary POST error', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}