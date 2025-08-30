// Utilities for mapping neighborhoods → canonical areas, plus friendly metadata.
import type { Area } from './types'

type CanonicalArea = {
  name: string
  /** Any alternate neighborhood names that should map to this area */
  aliases?: string[]
  /** Optional representative centroid for the area */
  center?: [number, number]
  /** Optional friendly cover image */
  image?: string
}

const PARIS: CanonicalArea[] = [
  {
    name: 'Le Marais',
    aliases: ['Marais', '3rd arrondissement', '4th arrondissement', 'Le Haut Marais'],
    center: [48.859, 2.361],
    image:
      'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1600&q=80',
  },
  {
    name: 'Saint-Germain',
    aliases: ['Saint-Germain-des-Prés', '6th arrondissement'],
    center: [48.853, 2.334],
    image:
      'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1600&q=80',
  },
  {
    name: 'Canal Saint-Martin',
    aliases: ['10th arrondissement', 'Canal Saint Martin'],
    center: [48.872, 2.364],
    image:
      'https://images.unsplash.com/photo-1471623432079-b009d30b6729?auto=format&fit=crop&w=1600&q=80',
  },
  {
    name: 'Montmartre',
    aliases: ['18th arrondissement'],
    center: [48.8867, 2.3431],
    image:
      'https://images.unsplash.com/photo-1464790719320-516ecd75af6c?auto=format&fit=crop&w=1600&q=80',
  },
]

const CANONICAL_BY_CITY: Record<string, CanonicalArea[]> = {
  paris: PARIS,
  // Add more cities as you expand
}

export function areaFromNeighborhood(city: string, neighborhood?: string | null): Area | null {
  if (!city) return null
  const list = CANONICAL_BY_CITY[city.toLowerCase()]
  if (!list || !neighborhood) return null

  const n = neighborhood.toLowerCase().trim()
  const hit = list.find(
    (a) =>
      a.name.toLowerCase() === n ||
      (a.aliases || []).some((al) => al.toLowerCase() === n)
  )
  if (!hit) return null
  return {
    name: hit.name,
    center: hit.center ?? [0, 0],
    image: hit.image,
  }
}

export function bestAreaForCoords(city: string, lat: number, lng: number): Area | null {
  const list = CANONICAL_BY_CITY[city.toLowerCase()]
  if (!list || !list.length) return null
  let best = list[0]
  let bestD = Number.POSITIVE_INFINITY
  for (const a of list) {
    const d = a.center ? distanceKm(lat, lng, a.center[0], a.center[1]) : 999
    if (d < bestD) {
      best = a
      bestD = d
    }
  }
  return { name: best.name, center: best.center ?? [lat, lng], image: best.image }
}

export function areaInfo(city: string, name: string): Area | null {
  const list = CANONICAL_BY_CITY[city.toLowerCase()]
  if (!list) return null
  const hit = list.find((a) => a.name.toLowerCase() === name.toLowerCase())
  if (!hit) return null
  return { name: hit.name, center: hit.center ?? [0, 0], image: hit.image }
}

// --- small geo util
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const la1 = toRad(aLat)
  const la2 = toRad(bLat)
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(la1) * Math.cos(la2)
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}
const toRad = (d: number) => (d * Math.PI) / 180