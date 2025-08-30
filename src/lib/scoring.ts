// Helpers to rank places for user prefs and pick areas/slot candidates.
import type { Area, AreaDay, Place, Prefs, SlotKey } from './types'
import { areaFromNeighborhood, bestAreaForCoords, distanceKm } from './areas'
import { createServerClient } from '@/lib/supabase/server'

/** Map user interests → place.types */
const INTEREST_TO_TYPES: Record<string, string[]> = {
  cafes: ['cafe', 'bakery', 'coffee'],
  restaurants: ['restaurant', 'bistro', 'fine_dining'],
  bars: ['bar', 'wine_bar', 'cocktail'],
  nightlife: ['bar', 'club'],
  galleries: ['gallery'],
  museums: ['museum'],
  parks: ['park', 'garden'],
  walks: ['walk', 'neighborhood_walk', 'lookout'],
  architecture: ['architecture', 'landmark'],
}

/** Main slot → required place type (coarse). */
export const SLOT_TO_TYPES: Record<SlotKey, string[]> = {
  cafe: ['cafe', 'bakery', 'coffee'],
  gallery: ['gallery'],
  lunch: ['restaurant', 'market', 'bistro'],
  walk: ['walk', 'neighborhood_walk', 'park', 'lookout'],
  bar: ['bar', 'wine_bar', 'cocktail'],
  dinner: ['restaurant', 'bistro', 'fine_dining'],
}

/** Score a place (0..100) for given prefs. Higher is better. */
export function scorePlaceForPrefs(place: Place, prefs: Prefs): number {
  let score = 50

  // 1) Type/interest match
  if (prefs.interests && prefs.interests.length) {
    const wanted = new Set(
      prefs.interests.flatMap((i) => INTEREST_TO_TYPES[i] || [])
    )
    const types = new Set((place.types || []).map((t) => t.toLowerCase()))
    const any = [...wanted].some((w) => types.has(w))
    score += any ? 25 : -10
  }

  // 2) Budget distance penalty (price_level 1..5)
  if (place.price_level != null) {
    const diff = Math.abs((place.price_level || 3) - (prefs.budget || 3))
    score += Math.max(0, 15 - diff * 7) // 15 for perfect, down to 0
  }

  // 3) Pace: nudge by category
  const fast = ['walk', 'lookout', 'cafe', 'bakery', 'market']
  const slow = ['museum', 'gallery', 'restaurant', 'fine_dining']
  const types = (place.types || []).map((t) => t.toLowerCase())
  const has = (set: string[]) => types.some((t) => set.includes(t))
  if (prefs.pace === 'relaxed') {
    score += has(slow) ? 6 : 0
  } else if (prefs.pace === 'packed') {
    score += has(fast) ? 6 : 0
  }

  // 4) Night vs day vibe
  if (prefs.wake === 'late') {
    if ((place.themes || []).includes('nightlife') || types.includes('bar')) score += 5
  }

  // clamp
  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Pick top areas by density of matching places.
 * Returns canonical Areas with centroid & optional image.
 */
export async function pickAreasByDensity(
  city: string,
  interests: string[] = [],
  limit = 3
): Promise<Area[]> {
  const supabase = createServerClient()

  // Build a union of needed types
  const typeSet = new Set<string>()
  for (const i of interests) (INTEREST_TO_TYPES[i] || []).forEach((t) => typeSet.add(t))
  const typeFilter = [...typeSet]
  // If no interests, just consider everything
  const sel = supabase
    .from('places')
    .select('neighborhood, lat, lng, city, name', { count: 'exact' })
    .eq('status', 'active')
    .eq('city', city)

  const { data, error } = typeFilter.length
    ? await sel.contains('types', typeFilter)
    : await sel

  if (error || !data) return []

  // Group by neighborhood and compute centroid + count
  const groups = new Map<
    string,
    { count: number; latSum: number; lngSum: number; sample: { lat: number; lng: number }[] }
  >()
  for (const r of data) {
    const key = (r.neighborhood || 'Unknown').trim()
    if (!groups.has(key)) {
      groups.set(key, { count: 0, latSum: 0, lngSum: 0, sample: [] })
    }
    const g = groups.get(key)!
    g.count += 1
    if (typeof r.lat === 'number' && typeof r.lng === 'number') {
      g.latSum += r.lat
      g.lngSum += r.lng
      if (g.sample.length < 8) g.sample.push({ lat: r.lat, lng: r.lng })
    }
  }

  // Rank by count, map through canonical area table if possible
  const ranked = [...groups.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 12)
    .map(([neigh, g]) => {
      const avgLat = g.latSum / Math.max(1, g.count)
      const avgLng = g.lngSum / Math.max(1, g.count)
      const canonical = areaFromNeighborhood(city, neigh) || bestAreaForCoords(city, avgLat, avgLng)
      return (
        canonical || {
          name: neigh,
          center: [avgLat, avgLng] as [number, number],
          image: undefined,
        }
      )
    })

  // Deduplicate by name, keep first occurrence
  const out: Area[] = []
  const seen = new Set<string>()
  for (const a of ranked) {
    const k = a.name.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(a)
    if (out.length >= limit) break
  }
  return out
}

/**
 * Select candidates for a given slot in an area, sorted by score.
 */
export async function pickSlot(
  slot: SlotKey,
  area: Area,
  prefs: Prefs,
  options?: { limit?: number; radiusKm?: number }
): Promise<Place[]> {
  const supabase = createServerClient()
  const limit = options?.limit ?? 8
  const radiusKm = options?.radiusKm ?? 2.5

  const types = SLOT_TO_TYPES[slot] || []
  if (!types.length) return []

  // First, get places in the same city with matching types
  let q = supabase
    .from('places')
    .select(
      'id, status, name, description, url, website, address, neighborhood, city, country, lat, lng, tags, types, cuisines, themes, rating, price_level, google_place_id, image_url'
    )
    .eq('status', 'active')
    .eq('city', prefs.city)
    .contains('types', types)

  const { data, error } = await q
  if (error || !data) return []

  // Filter by proximity to area center
  const nearby = data.filter(
    (p) => distanceKm(p.lat, p.lng, area.center[0], area.center[1]) <= radiusKm
  )

  // Score + sort
  const scored = nearby
    .map((p) => ({ p, s: scorePlaceForPrefs(p as Place, prefs) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(({ p }) => p as Place)

  return scored
}

/**
 * Small helper to assemble a default AreaDay for an area,
 * filling slots with top 1 candidate (if available).
 */
export async function buildAreaDay(
  area: Area,
  prefs: Prefs,
  slots: SlotKey[] = ['cafe', 'gallery', 'lunch', 'walk', 'bar', 'dinner']
): Promise<AreaDay> {
  const results = await Promise.all(
    slots.map(async (s) => {
      const picks = await pickSlot(s, area, prefs, { limit: 1 })
      return [s, picks[0] ?? null] as const
    })
  )

  const rec: Record<SlotKey, Place | null> = {
    cafe: null,
    gallery: null,
    lunch: null,
    walk: null,
    bar: null,
    dinner: null,
  }
  for (const [k, v] of results) rec[k] = v

  const summary = `Relaxed day exploring ${area.name} with a cosy café, a cultural stop, and great food & drinks.`
  return { area, summary, slots: rec }
}