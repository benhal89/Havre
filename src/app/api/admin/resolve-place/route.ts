import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const KEY = process.env.Google_PLACES_API_KEY || process.env.GOOGLE_PLACES_API_KEY

async function follow(url: string) {
  try { const r = await fetch(url, { redirect: 'follow' }); return r.url || url } catch { return url }
}

function parseMapsUrl(u: string) {
  const url = new URL(u)
  let visibleName = ''
  const idx = url.pathname.indexOf('/maps/place/')
  if (idx >= 0) {
    const after = url.pathname.slice(idx + '/maps/place/'.length)
    const stop = Math.min(...[after.indexOf('/'), after.indexOf('@'), after.indexOf('%40')].filter(n => n >= 0))
    const chunk = stop === Infinity ? after : after.slice(0, stop)
    try { visibleName = decodeURIComponent(chunk).replace(/\+/g, ' ').trim() }
    catch { visibleName = chunk.replace(/\+/g, ' ').trim() }
  }
  let lat: number | undefined, lng: number | undefined
  let m = u.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/)
  if (m) { lat = Number(m[1]); lng = Number(m[2]) }
  else {
    const q = url.searchParams.get('q') || url.searchParams.get('query') || ''
    const qm = q.match(/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/)
    if (qm) { lat = Number(qm[1]); lng = Number(qm[2]) }
  }
  const place_id = u.match(/place_id:([A-Za-z0-9_-]+)/)?.[1] || null
  return { visibleName, lat, lng, place_id }
}

function cuisinesFrom(types: string[], name: string, extra?: string, editorial?: string) {
  const set = new Set<string>()
  const hay = [name, extra || '', editorial || ''].join(' ').toLowerCase()
  ;['french','italian','japanese','korean','thai','vietnamese','chinese','indian','lebanese','mediterranean','greek','mexican','spanish','turkish','ethiopian','brazilian','peruvian','argentinian']
    .forEach(c => { if (types.includes(`${c}_restaurant`) || hay.includes(c)) set.add(c) })
  if (hay.includes('brunch')) set.add('brunch')
  if (types.includes('bakery') || hay.includes('bakery') || hay.includes('patisserie')) set.add('pastry')
  if (types.includes('bar') && hay.includes('wine')) set.add('natural_wine')
  return Array.from(set)
}

async function getPlaceDetails(placeId: string) {
  const fields = [
    'name',
    'formatted_address',
    'geometry/location',
    'website',
    'international_phone_number',
    'price_level',
    'rating',
    'types',
    'url',
    'editorial_summary',
    'address_components',
    // both “opening_hours” and “current_opening_hours” — some places only return one
    'opening_hours',
    'current_opening_hours',
  ].join(',')
  const det = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?key=${KEY}&place_id=${placeId}&language=en&fields=${fields}`
  )
  return det.json()
}

function normalizeOpeningHours(details: any) {
  // Prefer "current_opening_hours" (reflects today), else "opening_hours"
  const src = details?.current_opening_hours || details?.opening_hours
  if (!src) return undefined
  const out: any = {}
  if (typeof src.open_now === 'boolean') out.open_now = src.open_now
  if (Array.isArray(src.weekday_text)) out.weekday_text = src.weekday_text
  if (Array.isArray(src.periods)) out.periods = src.periods
  // Keep special_day if present (holidays)
  if (Array.isArray(src.special_days)) out.special_days = src.special_days
  return out
}

function normalizeDetails(dj: any, parsed: any, placeId: string) {
  const details = dj?.result
  if (!details) return null

  const comps = details.address_components || []
  const pick = (t: string) => comps.find((c: any) => c.types?.includes(t))?.long_name
  const city = pick('locality') || pick('postal_town') || pick('sublocality')
  const country = pick('country')
  const neighborhood = pick('sublocality') || pick('neighborhood')

  const lat = details.geometry?.location?.lat
  const lng = details.geometry?.location?.lng
  const name = details.name
  const formatted_address = details.formatted_address
  const price_level = details.price_level
  const rating = details.rating
  const website = details.website
  const phone = details.international_phone_number
  const gtypes: string[] = details.types || []
  const editorial_summary: string | undefined = details.editorial_summary?.overview
  const place_url = details.url
  const cuisines = cuisinesFrom(gtypes, name, parsed.visibleName, editorial_summary)
  const opening_hours = normalizeOpeningHours(details)

  return {
    source: 'google',
    place_id: placeId,
    name,
    address: formatted_address,
    city: city || undefined,
    country: country || undefined,
    neighborhood: neighborhood || undefined,
    lat, lng,
    website: website || undefined,
    phone: phone || undefined,
    price_level,
    rating: typeof rating === 'number' ? rating : undefined,
    types: gtypes,
    editorial_summary,
    cuisines,
    opening_hours,                   // <-- NEW (JSON)
    place_url: place_url || undefined,
  }
}

export async function POST(req: Request) {
  try {
    const ctype = req.headers.get('content-type') || ''
    if (!ctype.includes('application/json')) {
      return NextResponse.json({ error: 'Use application/json body.' }, { status: 415 })
    }
    const body = await req.json()
    const url = body?.url as string | undefined
    const hint = (body?.hint as string | undefined)?.trim()
    const forcePlaceId = (body?.forcePlaceId as string | undefined)?.trim()

    if (!url && !forcePlaceId) {
      return NextResponse.json({ error: 'Provide "url" or "forcePlaceId".' }, { status: 400 })
    }

    if (!KEY) {
      if (!url) return NextResponse.json({ error: 'No GOOGLE_PLACES_API_KEY and no URL.' }, { status: 500 })
      const finalUrl = /maps\.app\.goo\.gl/.test(url) ? await follow(url) : url
      const parsed = parseMapsUrl(finalUrl)
      return NextResponse.json({ ...parsed, warning: 'GOOGLE_PLACES_API_KEY not set; parsed basics only.' })
    }

    if (forcePlaceId) {
      const dj = await getPlaceDetails(forcePlaceId)
      const norm = normalizeDetails(dj, {}, forcePlaceId)
      if (!norm) return NextResponse.json({ error: 'Details not found for forced place_id.' }, { status: 404 })
      return NextResponse.json({ ...norm, candidates: [] })
    }

    const finalUrl = /maps\.app\.goo\.gl/.test(url!) ? await follow(url!) : url!
    const parsed = parseMapsUrl(finalUrl)

    let placeId: string | null = parsed.place_id
    let candidates: Array<{ place_id: string, name: string, formatted_address?: string }> = []
    const searchText = (hint && hint.length > 2) ? hint : parsed.visibleName

    if (!placeId && searchText) {
      const bias = (parsed.lat && parsed.lng) ? `&locationbias=circle:250@${parsed.lat},${parsed.lng}` : ''
      const fp = await fetch(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json` +
        `?key=${KEY}&inputtype=textquery&language=en` +
        `&fields=place_id,name,formatted_address,geometry,types` +
        `&input=${encodeURIComponent(searchText)}${bias}`
      )
      const fj = await fp.json()
      const cands = (fj?.candidates || []) as any[]
      candidates = cands.slice(0, 5).map(c => ({ place_id: c.place_id, name: c.name, formatted_address: c.formatted_address }))
      placeId = cands?.[0]?.place_id || null
    }

    if (!placeId && parsed.lat && parsed.lng && searchText) {
      const ts = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json` +
        `?key=${KEY}&language=en&query=${encodeURIComponent(searchText)}` +
        `&location=${parsed.lat},${parsed.lng}&radius=300`
      )
      const tj = await ts.json()
      const results = (tj?.results || []) as any[]
      if (results.length) {
        placeId = results[0].place_id
        if (!candidates.length) {
          candidates = results.slice(0, 5).map(r => ({ place_id: r.place_id, name: r.name, formatted_address: r.formatted_address }))
        }
      }
    }

    if (!placeId && parsed.lat && parsed.lng) {
      const near = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
        `?key=${KEY}&location=${parsed.lat},${parsed.lng}&radius=60&language=en`
      )
      const nj = await near.json()
      const results = (nj?.results || []) as any[]
      if (results.length) {
        placeId = results[0].place_id
        if (!candidates.length) {
          candidates = results.slice(0, 5).map(r => ({ place_id: r.place_id, name: r.name }))
        }
      }
    }

    if (!placeId) {
      return NextResponse.json({
        ...parsed,
        candidates,
        warning: 'Could not resolve a Google place_id from the provided link or hint.',
      }, { status: 200 })
    }

    const dj = await getPlaceDetails(placeId)
    const norm = normalizeDetails(dj, parsed, placeId)
    if (!norm) {
      return NextResponse.json({ ...parsed, candidates, warning: 'Place details not found.' }, { status: 200 })
    }

    return NextResponse.json({ ...norm, candidates })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'resolve failed' }, { status: 500 })
  }
}

export async function GET()     { return NextResponse.json({ error: 'Use POST.' }, { status: 405 }) }
export async function PUT()     { return NextResponse.json({ error: 'Use POST.' }, { status: 405 }) }
export async function DELETE()  { return NextResponse.json({ error: 'Use POST.' }, { status: 405 }) }