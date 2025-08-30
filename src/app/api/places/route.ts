import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

export type Place = {
  id: string
  name: string
  description: string | null
  address: string | null
  city: string
  country: string
  lat: number
  lng: number
  website: string | null
  google_place_id: string | null
  types: string[]
  themes: string[]
  rating?: number | null
  price_level?: number | null
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const city = (searchParams.get('city') || 'Paris').trim()
  const types = (searchParams.get('types') || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  const themes = (searchParams.get('themes') || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  const limit = Math.min(parseInt(searchParams.get('limit') || '24', 10) || 24, 60)

  const supabase = createClient()

  // Base: active places in the chosen city
  let query = supabase
    .from('places')
    .select('id,name,description,address,city,country,lat,lng,website,google_place_id,types,themes,rating,price_level')
    .eq('status', 'active')
    .eq('city', city)

  if (types.length)  query = query.contains('types',  types)
  if (themes.length) query = query.contains('themes', themes)

  // Fetch a larger sample, then shuffle for pleasant variety
  const { data, error } = await query.limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const arr = (data || []) as Place[]

  // Fisher–Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }

  return NextResponse.json({ places: arr.slice(0, limit) })
}