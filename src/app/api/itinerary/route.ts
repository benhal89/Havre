// src/app/api/itinerary/route.ts
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

type Place = {
  id: string
  name: string
  city: string | null
  country: string | null
  address: string | null
  lat: number | null
  lng: number | null
  price_level: number | null
  types: string[] | null
  cuisines: string[] | null
  description: string | null
  website: string | null
  rating: number | null
  opening_hours: { weekday_text?: string[] } | null
  status: string
}

type Activity = { time?: string; title: string; details?: string; mapUrl?: string; tags?: string[] }
type DayPlan = { date?: string; activities: Activity[] }
type Itinerary = { days: DayPlan[]; notes?: string }

// ---- helpers ---------------------------------------------------------------

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }

function parseNumDays(dates: string | null): number {
  // accepts "YYYY-MM-DD to YYYY-MM-DD" or fallback 3
  if (!dates) return 3
  const m = dates.match(/(\d{4}-\d{2}-\d{2}).+?(\d{4}-\d{2}-\d{2})/)
  if (!m) return 3
  const start = new Date(m[1])
  const end = new Date(m[2])
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
  return clamp(days || 3, 1, 14)
}

function timeSlots(hours: string, pace: string): string[] {
  // return a list of 24h "HH:MM" approximate anchors
  const early = ['08:30','10:30','12:30','15:00','18:30','21:00']
  const balanced = ['09:30','11:30','13:00','15:30','19:00','21:30']
  const late = ['10:30','12:30','14:00','16:00','19:30','22:00']
  let base = hours === 'early' ? early : hours === 'late' ? late : balanced
  if (pace === 'chill') base = [base[1], base[2], base[3], base[4]] // drop 2
  if (pace === 'packed') base = [...base, '23:30'] // add one more
  return base
}

function isLikelyMealSlot(t: string) {
  const [h] = t.split(':').map(Number)
  return (h >= 11 && h <= 14) || (h >= 18 && h <= 21)
}
function isEveningSlot(t: string) {
  const [h] = t.split(':').map(Number)
  return h >= 21 || h <= 2
}

function normalize(x: number| null, min=3.8, max=5.0) {
  if (x == null) return 0.5
  return clamp((x - min) / (max - min), 0, 1)
}

function pricePenalty(placePrice: number | null, budget: number) {
  if (!placePrice) return 0
  const diff = Math.abs(placePrice - budget) // 0..4
  return (diff / 4) // 0..1
}

function interestMatchRatio(types: string[] | null, wanted: Set<string>) {
  if (!types || types.length === 0 || wanted.size === 0) return 0
  const hits = types.filter(t => wanted.has(t)).length
  return hits / Math.max(types.length, wanted.size)
}

function openTextContainsHour(text: string, hour: number) {
  // naive pass: if the line contains "Closed", say closed, else if it contains an hour block near target, call open
  // Example: "Monday: 12–14:30, 19–22"
  if (/closed/i.test(text)) return false
  // try to spot the hour number
  const hr = text.match(/\b(\d{1,2})(?::\d{2})?\b/g)
  if (!hr) return true // unknown → assume open
  const nums = hr.map(s => parseInt(s, 10)).filter(n => n>=0 && n<=24)
  // crude: if any number within +/-2 hours, assume open
  return nums.some(n => Math.abs(n - hour) <= 2)
}

function isOpenAt(place: Place, weekdayIdx: number, timeHHMM: string): boolean {
  if (!place.opening_hours?.weekday_text || place.opening_hours.weekday_text.length === 0) return true
  const [H] = timeHHMM.split(':').map(Number)
  // Google gives text lines like "Monday: 12–14:30, 19–22"
  const lines = place.opening_hours.weekday_text
  const line = lines[weekdayIdx] || lines.find(l => /Mon|Tue|Wed|Thu|Fri|Sat|Sun/i.test(l)) || ''
  return openTextContainsHour(line, H)
}

function toMapUrl(p: Place) {
  const q = encodeURIComponent(`${p.name ?? ''} ${p.lat ?? ''},${p.lng ?? ''}`)
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}

function slotTypeWanted(slot: string, interests: Set<string>) {
  if (isEveningSlot(slot) && (interests.has('bar') || interests.has('club') || interests.has('wine_bar'))) {
    return new Set(['bar','club','wine_bar','rooftop'])
  }
  if (isLikelyMealSlot(slot)) {
    // prefer restaurants/cafés at meal times
    const meal = new Set(['restaurant','cafe','wine_bar'])
    // if user did not include food at all, still allow, but lower score later
    return meal
  }
  // daytime: culture/outdoors/shopping
  return new Set(['museum','gallery','landmark','park','garden','boutique','neighborhood_walk'])
}

// ---- main handler ----------------------------------------------------------

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer()   // <— IMPORTANT: await

    const body = await req.json().catch(() => ({}))

    // Backward‑compat inputs
    const destination: string = body.destination || body.city || 'Paris'
    const [city] = destination.split(',').map((s:string)=>s.trim())
    const dates: string | null = body.dates ?? null
    const numDays: number = body.numDays || parseNumDays(dates) || 3

    const interestsStr: string = body.interests || ''
    const interests = new Set(
      interestsStr
        .split(',')
        .map((s:string)=>s.trim().toLowerCase())
        .filter(Boolean)
        // strip meta tokens you added earlier
        .filter((s:string)=>!/^budget:|^home_base:|^hours:|^pace:|^freeform:|^seed:/.test(s))
    )

    const budget = clamp(Number((interestsStr.match(/budget:(\d)/)?.[1]) ?? body.budget ?? 3), 1, 5)
    const hours = (interestsStr.match(/hours:(early|balanced|late)/)?.[1] ?? body.hours ?? 'balanced') as 'early'|'balanced'|'late'
    const pace = (interestsStr.match(/pace:(chill|balanced|packed)/)?.[1] ?? body.pace ?? 'balanced') as 'chill'|'balanced'|'packed'

    // base query
    let q = supabase
      .from('places')
      .select('*')
      .eq('status','active')
      .eq('city', city)

    // types filter if interests include any known types
    const wantedTypes = Array.from(interests).filter(t =>
      ['restaurant','cafe','wine_bar','bar','club','market',
       'museum','gallery','theatre','landmark','park','garden',
       'rooftop','boutique','spa','event_venue','neighborhood_walk'
      ].includes(t)
    )
    if (wantedTypes.length) q = q.overlaps('types', wantedTypes)

    // budget window
    q = q.gte('price_level', Math.max(1, budget - 1)).lte('price_level', Math.min(5, budget + 1))

    // pull a generous pool
    const { data: pool, error } = await q.order('rating', { ascending: false }).limit(200)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const candidates: Place[] = (pool ?? []) as any

    // Build plan
    const days: DayPlan[] = []
    const usedIds = new Set<string>()

    for (let d = 0; d < numDays; d++) {
      const slots = timeSlots(hours, pace)
      const weekdayIdx = (new Date().getDay() + d) % 7 // crude: start from today’s weekday
      const activities: Activity[] = []

      // keep per-day type counts to avoid repetition
      const typeCount: Record<string, number> = {}

      for (const slot of slots) {
        // derive preferred types for this slot
        const preferred = slotTypeWanted(slot, new Set(wantedTypes))
        // score
        const scored = candidates
          .filter(p => !usedIds.has(p.id))
          .map((p) => {
            const ratingScore = 1.0 * normalize(p.rating ?? 4.2)
            const priceScore = -0.3 * pricePenalty(p.price_level ?? budget, budget)
            const intrRatio = interestMatchRatio(p.types ?? [], new Set(wantedTypes))
            const interestScore = 0.2 * intrRatio

            const repPenalty = (() => {
              const pt = (p.types ?? [])[0]
              if (!pt) return 0
              const c = typeCount[pt] || 0
              return -0.1 * Math.max(0, c - 1) // allow first, penalize 2+
            })()

            const openPenalty = (() => {
              return isOpenAt(p, weekdayIdx, slot) ? 0 : -0.1
            })()

            const preferBySlot = (() => {
              // small boost if its type is among preferred for this slot
              const pt = (p.types ?? [])[0]
              if (pt && preferred.has(pt)) return 0.05
              return 0
            })()

            const jitter = (Math.random() - 0.5) * 0.02

            const score = ratingScore + priceScore + interestScore + repPenalty + openPenalty + preferBySlot + jitter
            return { p, score }
          })
          .sort((a, b) => b.score - a.score)

        const pick = scored.length ? scored[0].p : null
        if (!pick) continue

        // mark usage
        usedIds.add(pick.id)
        const mainType = (pick.types ?? [])[0]
        if (mainType) typeCount[mainType] = (typeCount[mainType] || 0) + 1

        // build activity card
        const title = pick.name
        const details = pick.description || pick.address || ''
        const tags = [
          ...(pick.types ?? []).slice(0,2),
          pick.cuisines?.[0] ?? ''
        ].filter(Boolean)

        activities.push({
          time: slot,
          title,
          details,
          mapUrl: toMapUrl(pick),
          tags,
        })
      }

      days.push({ activities })
    }

    const notes = 'Pro tip: tap “Swap” in the UI to shuffle a slot. Opening hours are best‑effort; verify before you go.'

    const out: Itinerary = { days, notes }
    return NextResponse.json(out)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'itinerary failed' }, { status: 500 })
  }
}