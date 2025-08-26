// src/app/api/admin/places/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // minimal required fields
    const required = ['name', 'city', 'country', 'lat', 'lng', 'price_level', 'types']
    for (const k of required) {
      if (body[k] === undefined || body[k] === null || body[k] === '') {
        return NextResponse.json({ error: `Missing field: ${k}` }, { status: 400 })
      }
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !service) {
      return NextResponse.json(
        { error: 'Supabase env missing (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)' },
        { status: 500 }
      )
    }
    const supabase = createClient(url, service)

    // Try to find existing by (name + address) when address present; fallback to (name + city + country)
    const match = body.address
      ? { name: body.name, address: body.address }
      : { name: body.name, city: body.city, country: body.country }

    let { data: existing, error: findErr } = await supabase
      .from('places')
      .select('id')
      .match(match)
      .limit(1)
      .maybeSingle()

    if (findErr) {
      return NextResponse.json({ error: findErr.message }, { status: 500 })
    }

    const payload = {
      name: body.name,
      city: body.city,
      country: body.country,
      neighborhood: body.neighborhood ?? null,
      address: body.address ?? null,
      lat: body.lat,
      lng: body.lng,
      price_level: body.price_level,
      types: body.types ?? [],
      cuisines: body.cuisines ?? null,
      description: body.description ?? null,
      website: body.website ?? null,
      rating_source: body.rating_source ?? 'manual',
      rating: body.rating ?? null,
      opening_hours: body.opening_hours ?? null,
      status: body.status ?? 'draft',
      google_place_id: body.google_place_id ?? null,
    }

    if (existing?.id) {
      const { data, error } = await supabase
        .from('places')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ updated: true, place: data })
    } else {
      const { data, error } = await supabase
        .from('places')
        .insert(payload)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ created: true, place: data })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'insert failed' }, { status: 500 })
  }
}