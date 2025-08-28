// src/app/api/admin/resolve-place/route.ts
import { NextResponse } from 'next/server'

type GDetailsResp = {
  result?: any
  status?: string
  candidates?: { place_id: string }[]
}

const ALLOWED_TYPES = new Set([
  'restaurant','cafe','bar','bakery','night_club','tourist_attraction','museum','art_gallery','park'
])

// map some Google types -> your tags
function tagsFromTypes(types: string[] = []) {
  const t = new Set<string>()
  for (const ty of types) {
    if (ty === 'cafe') t.add('cafes')
    if (ty === 'restaurant') t.add('restaurants')
    if (ty === 'bar') t.add('bars')
    if (ty === 'night_club') t.add('nightlife')
    if (ty === 'museum') t.add('museums')
    if (ty === 'art_gallery') t.add('galleries')
    if (ty === 'park') t.add('parks')
  }
  return Array.from(t)
}

function cuisinesFromTypes(types: string[] = []) {
  const known = [
    'italian','japanese','sushi','ramen','thai','indian','korean','lebanese','greek','seafood','vegan','vegetarian'
  ]
  return types.filter(t => known.includes(t))
}

function cleanTypes(types: string[] = []) {
  return types.filter(t => ALLOWED_TYPES.has(t))
}

// try to extract a reasonable text query from a gmaps URL
function guessQueryFromUrl(u: URL) {
  const q = u.searchParams.get('q')
  if (q) return q
  // /place/<Name>/... or /search/<query>
  const parts = u.pathname.split('/').filter(Boolean)
  const iPlace = parts.indexOf('place')
  if (iPlace >= 0 && parts[iPlace + 1]) return decodeURIComponent(parts[iPlace + 1])
  const iSearch = parts.indexOf('search')
  if (iSearch >= 0 && parts[iSearch + 1]) return decodeURIComponent(parts[iSearch + 1])
  // fallback: whole url text
  return decodeURIComponent(u.toString())
}

function addrPart(components: any[], type: string) {
  const c = components?.find((x: any) => x.types?.includes(type))
  return c?.long_name || null
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const raw = (searchParams.get('url') || '').trim()
    if (!raw) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

    const apiKey =
      process.env.GOOGLE_PLACES_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Google Places API key' }, { status: 500 })
    }

    // 1) Follow short links to the final URL (maps.app.goo.gl -> long google maps URL)
    let finalUrl = raw
    try {
      const resp = await fetch(raw, { redirect: 'follow' })
      // even HEAD sometimes is blocked; GET small should be fine
      finalUrl = resp.url || raw
    } catch {
      // ignore; keep raw
    }
    const urlObj = new URL(finalUrl)

    // 2) If the URL already has a place_id param, use it
    let placeId = urlObj.searchParams.get('place_id') || ''

    // 3) Otherwise, use "Find Place from Text" with a guessed query
    if (!placeId) {
      const query = guessQueryFromUrl(urlObj)
      const fp = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json')
      fp.searchParams.set('input', query)
      fp.searchParams.set('inputtype', 'textquery')
      fp.searchParams.set('fields', 'place_id,geometry')
      fp.searchParams.set('key', apiKey)

      const fpRes = await fetch(fp.toString())
      const fpJson = (await fpRes.json()) as GDetailsResp
      const cand = fpJson?.candidates?.[0]
      placeId = cand?.place_id || ''
      if (!placeId) {
        return NextResponse.json({ error: 'Could not resolve a place from this link.' }, { status: 404 })
      }
    }

    // 4) Place Details for rich data
    const det = new URL('https://maps.googleapis.com/maps/api/place/details/json')
    det.searchParams.set('place_id', placeId)
    det.searchParams.set(
      'fields',
      [
        'name',
        'formatted_address',
        'address_component',
        'geometry',
        'international_phone_number',
        'website',
        'url',
        'rating',
        'price_level',
        'opening_hours',
        'photos',
        'editorial_summary',
        'types'
      ].join(',')
    )
    det.searchParams.set('key', apiKey)

    const detRes = await fetch(det.toString())
    const detJson = (await detRes.json()) as GDetailsResp
    const r = detJson?.result
    if (!r) {
      return NextResponse.json({ error: 'Place details not found.' }, { status: 404 })
    }

    const comps = r.address_components || []
    const city =
      addrPart(comps, 'locality') ||
      addrPart(comps, 'postal_town') ||
      addrPart(comps, 'sublocality') ||
      null
    const country = addrPart(comps, 'country')
    const lat = r.geometry?.location?.lat ?? null
    const lng = r.geometry?.location?.lng ?? null

    let photoUrl: string | null = null
    if (Array.isArray(r.photos) && r.photos.length > 0) {
      const ref = r.photos[0]?.photo_reference
      if (ref) {
        const p = new URL('https://maps.googleapis.com/maps/api/place/photo')
        p.searchParams.set('maxwidth', '800')
        p.searchParams.set('photo_reference', ref)
        p.searchParams.set('key', apiKey)
        photoUrl = p.toString()
      }
    }

    const types: string[] = Array.isArray(r.types) ? r.types : []
    const payload = {
      name: r.name || '',
      address: r.formatted_address || '',
      city,
      country,
      lat,
      lng,
      website: r.website || null,
      url: r.url || null,
      phone: r.international_phone_number || null,
      rating: typeof r.rating === 'number' ? r.rating : null,
      price_level: typeof r.price_level === 'number' ? r.price_level : null,
      opening_hours: r.opening_hours || null,
      tz: null as string | null, // optional: could call Time Zone API if needed
      types: cleanTypes(types),
      cuisines: cuisinesFromTypes(types),
      themes: [], // fill manually in UI
      tags: tagsFromTypes(types),
      neighborhood: null,
      gyg_url: null,
      // extras for UI convenience (not stored if you don't want)
      _photo: photoUrl,
      _place_id: placeId,
      _summary: r.editorial_summary?.overview || null,
    }

    return NextResponse.json(payload, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Resolve error' }, { status: 500 })
  }
}