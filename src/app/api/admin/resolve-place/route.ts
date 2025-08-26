// src/app/api/admin/resolve-place/route.ts
import { NextResponse } from 'next/server'

const BASE = 'https://places.googleapis.com/v1'

async function searchText(query: string, key: string) {
  const res = await fetch(`${BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.addressComponents,places.primaryType,places.types,places.rating,places.priceLevel',
    },
    body: JSON.stringify({ textQuery: query }),
  })
  const j = await res.json()
  if (!res.ok) throw new Error(j?.error?.message || `Text search failed (${res.status})`)
  return j?.places?.[0]
}

async function getDetails(placeId: string, key: string) {
  const res = await fetch(`${BASE}/places/${encodeURIComponent(placeId)}?fields=formattedAddress,websiteUri,internationalPhoneNumber,openingHours,editorialSummary,types,primaryType,priceLevel,rating,displayName,addressComponents,location`, {
    headers: { 'X-Goog-Api-Key': key }
  })
  const j = await res.json()
  if (!res.ok) throw new Error(j?.error?.message || `Details failed (${res.status})`)
  return j
}

function extractCityCountry(components: any[] | undefined) {
  let city: string | undefined
  let country: string | undefined
  components?.forEach((c) => {
    if (c.types?.includes('locality') || c.types?.includes('postal_town')) city = c.longText || c.shortText
    if (c.types?.includes('country')) country = c.longText || c.shortText
  })
  return { city, country }
}

function toCuisine(types: string[] | undefined) {
  if (!types) return []
  const lower = types.map(t => t.toLowerCase())
  const known = ['french', 'italian', 'japanese', 'chinese', 'thai', 'indian', 'spanish', 'mexican', 'korean', 'brunch', 'seafood', 'steakhouse', 'mediterranean', 'middle_eastern']
  return known.filter(k => lower.includes(k) || lower.includes(`${k}_restaurant`) || lower.includes(k.replace(' ', '_')))
}

export async function POST(req: Request) {
  try {
    const { url, hint } = await req.json().catch(() => ({}))
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 })
    }
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || process.env.GOOGLE_MAPS_KEY
    if (!key) return NextResponse.json({ error: 'Missing GOOGLE MAPS API key' }, { status: 500 })

    // Step 1: use the URL (plus an optional hint) as a textQuery
    const first = await searchText(hint ? `${url} ${hint}` : url, key)
    if (!first?.id) {
      return NextResponse.json({ error: 'No place found for the provided link' }, { status: 404 })
    }

    // Step 2: load full details
    const det = await getDetails(first.id, key)

    const { city, country } = extractCityCountry(det?.addressComponents)
    const cuisines = toCuisine(det?.types)

    const out = {
      source: 'google',
      place_id: first.id,
      name: det?.displayName?.text || first?.displayName?.text || null,
      address: det?.formattedAddress || first?.formattedAddress || null,
      city: city || null,
      country: country || null,
      lat: det?.location?.latitude ?? first?.location?.latitude ?? null,
      lng: det?.location?.longitude ?? first?.location?.longitude ?? null,
      website: det?.websiteUri || null,
      phone: det?.internationalPhoneNumber || null,
      price_level: typeof det?.priceLevel === 'number' ? det.priceLevel : (typeof first?.priceLevel === 'number' ? first.priceLevel : null),
      rating: typeof det?.rating === 'number' ? det.rating : (typeof first?.rating === 'number' ? first.rating : null),
      types: det?.types || first?.types || [],
      editorial_summary: det?.editorialSummary?.text || null,
      opening_hours: det?.openingHours || null,
      cuisines,
      place_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(det?.displayName?.text || '')}&query_place_id=${encodeURIComponent(first.id)}`,
    }

    return NextResponse.json(out)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'resolve failed' }, { status: 500 })
  }
}