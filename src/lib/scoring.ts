import type { Area } from './types'

// --- Canonical area metadata (extend as needed) ---
// Each entry must include a center so we can compute proximity.
const PARIS_AREAS: Record<string, { center: [number, number]; cover?: string; description?: string; sights?: string[] }> = {
  'Le Marais': {
    center: [48.8589, 2.3570],
    cover: 'https://images.unsplash.com/photo-1543349689-9a4d6c6f5f36?q=80&w=1600&auto=format&fit=crop',
    description: 'Historic lanes, boutiques, cafés, and galleries.',
    sights: ['Place des Vosges', 'Musée Picasso', 'Rue des Rosiers'],
  },
  'Saint‑Germain': {
    center: [48.8532, 2.3335],
    cover: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1600&auto=format&fit=crop',
    description: 'Left Bank cafés, bookshops and classic bistros.',
    sights: ['Café de Flore', 'Église Saint‑Germain‑des‑Prés'],
  },
  'Canal Saint‑Martin': {
    center: [48.8720, 2.3655],
    cover: 'https://images.unsplash.com/photo-1562788869-4ed32648eb72?q=80&w=1600&auto=format&fit=crop',
    description: 'Trendy waterside hangouts, coffee, and natural wine.',
    sights: ['Footbridges', 'Quai de Jemmapes'],
  },
  'Montmartre': {
    center: [48.8867, 2.3431],
    cover: 'https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?q=80&w=1600&auto=format&fit=crop',
    description: 'Village on a hill, studios and sweeping views.',
    sights: ['Sacré‑Cœur', 'Place du Tertre'],
  },
  'Bastille': {
    center: [48.8530, 2.3690],
    cover: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1600&auto=format&fit=crop',
    description: 'Lively bars, bistros and night spots.',
    sights: ['Opéra Bastille', 'Rue de Lappe'],
  },
}

// Index by city name
const AREA_INDEX: Record<string, typeof PARIS_AREAS> = {
  Paris: PARIS_AREAS,
}

// --- Utilities ---
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const s1 = Math.sin(dLat / 2) ** 2
  const s2 = Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(s1 + s2), Math.sqrt(1 - (s1 + s2)))
  return R * c
}

/** Map raw neighborhood strings to canonical area names. */
export function areaFromNeighborhood(city: string, neighborhood: string | null | undefined): Area | null {
  if (!neighborhood) return null
  const lib = AREA_INDEX[city]
  if (!lib) return null
  const n = neighborhood.toLowerCase().trim()

  // Simple alias list per city – extend as needed
  const aliases: Record<string, string> = {
    marais: 'Le Marais',
    'le marais': 'Le Marais',
    bastille: 'Bastille',
    montmartre: 'Montmartre',
    'canal saint-martin': 'Canal Saint‑Martin',
    'canal st martin': 'Canal Saint‑Martin',
    "saint germain": 'Saint‑Germain',
    'st-germain': 'Saint‑Germain',
  }
  const canonicalName = aliases[n] || Object.keys(lib).find((k) => k.toLowerCase() === n)
  if (!canonicalName) return null
  const m = lib[canonicalName]
  return { name: canonicalName, center: m.center, image: m.cover }
}

/** Pick the closest known area (by city) to the given coords. */
export function bestAreaForCoords(city: string, lat: number, lng: number): Area | null {
  const lib = AREA_INDEX[city]
  if (!lib) return null
  let best: { name: string; d: number } | null = null
  for (const [name, meta] of Object.entries(lib)) {
    const d = distanceKm(lat, lng, meta.center[0], meta.center[1])
    if (!best || d < best.d) best = { name, d }
  }
  if (!best) return null
  const meta = lib[best.name]
  return { name: best.name, center: meta.center, image: meta.cover }
}

/** Optional: fetch rich metadata (cover/description/sights) to decorate UI. */
export function getAreaMeta(city: string, name: string): { cover?: string; description?: string; sights?: string[] } | null {
  const lib = AREA_INDEX[city]
  if (!lib) return null
  const m = lib[name]
  if (!m) return null
  const { cover, description, sights } = m
  return { cover, description, sights }
}

export { AREA_INDEX }