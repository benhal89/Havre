// src/app/api/google/place-details/route.ts
import { NextResponse } from 'next/server'

/**
 * Returns details for a place:
 * - photoUrl (Google Place Photo)
 * - googleUrl (place on Google Maps)
 * - placeId, website, summary (if available)
 * - address (formatted address)
 *
 * Query params:
 *   ?name=Clamato&city=Paris&lat=48.85&lng=2.35  (city/lat/lng optional but helps disambiguate)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const name = (searchParams.get('name') || '').trim()
  const city = (searchParams.get('city') || '').trim()
  const lat = parseFloat(searchParams.get('lat') || '')
  const lng = parseFloat(searchParams.get('lng') || '')
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng)

  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

  // always return a valid JSON shape
  const empty = {
    placeId: null as string | null,
    photoUrl: null as string | null,
    googleUrl: null as string | null,
    summary: null as string | null,
    website: null as string | null,
    address: null as string | null,
  }

  if (!apiKey || !name) {
    return NextResponse.json(empty, { status: 200 })
  }

  // --- 1) Find a placeId via Text Search (bias by location if provided)
  const textQuery = city ? `${name}, ${city}` : name
  const tsBase = 'https://maps.googleapis.com/maps/api/place/textsearch/json'
  const tsParams = new URLSearchParams({
    query: textQuery,
    key: apiKey,
  })
  if (hasCoords) {
    tsParams.set('location', `${lat},${lng}`)
    tsParams.set('radius', '6000')
  }

  const tsRes = await fetch(`${tsBase}?${tsParams.toString()}`, {
    next: { revalidate: 60 * 10 },
  })
  const tsJson = await tsRes.json().catch(() => ({} as any))

  const first = Array.isArray(tsJson?.results) ? tsJson.results[0] : null
  const placeId: string | null = first?.place_id || null
  // sometimes text search has no photo; we’ll fall back to Details
  let photoRef: string | null = first?.photos?.[0]?.photo_reference || null

  let googleUrl: string | null =
    placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : null

  // --- 2) Place Details for richer data (photos, summary, website, address)
  // even if we already have a photoRef, ask for editorial summary & website
  let website: string | null = null
  let summary: string | null = null
  let address: string | null = null

  if (placeId) {
    const detailsBase = 'https://maps.googleapis.com/maps/api/place/details/json'
    const dParams = new URLSearchParams({
      key: apiKey,
      place_id: placeId,
      // request photos + editorial_summary + website + address
      fields: 'url,website,editorial_summary,formatted_address,photos',
    })
    const dRes = await fetch(`${detailsBase}?${dParams.toString()}`, {
      next: { revalidate: 60 * 10 },
    })
    const dJson = await dRes.json().catch(() => ({} as any))
    const result = dJson?.result

    website = result?.website || null
    address = result?.formatted_address || null
    summary = result?.editorial_summary?.overview || null
    if (!googleUrl && result?.url) googleUrl = result.url

    // If Text Search did not provide a photo, try Details photos
    if (!photoRef && Array.isArray(result?.photos) && result.photos.length > 0) {
      photoRef = result.photos[0]?.photo_reference || null
    }
  }

  // --- 3) Build a real Photo URL (if we have a photo reference)
  let photoUrl: string | null = null
  if (photoRef) {
    const photoBase = 'https://maps.googleapis.com/maps/api/place/photo'
    const p = new URLSearchParams({
      key: apiKey,
      maxwidth: '1200',
      photoreference: photoRef,
    })
    photoUrl = `${photoBase}?${p.toString()}`
  }

  // --- 4) Friendly fallback summary if none from Google
  if (!summary) {
    const pieces = [name]
    if (city) pieces.push(`in ${city}`)
    if (address) pieces.push(`(${address})`)
    summary = pieces.join(' ') + '.'
  }

  return NextResponse.json({
    placeId,
    photoUrl,
    googleUrl,
    summary,
    website,
    address,
  })
}