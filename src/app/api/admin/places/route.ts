import { NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Read env once (safe if undefined)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE

// Only columns that exist in your `places` table
const ALLOWED_KEYS = new Set([
  'name','city','country','neighborhood','address',
  'lat','lng','price_level','types','cuisines',
  'description','website','rating_source','status','rating','opening_hours', 
])

function pickAllowed(input: Record<string, any>) {
  const out: Record<string, any> = {}
  for (const k of Object.keys(input)) if (ALLOWED_KEYS.has(k)) out[k] = input[k]
  return out
}

function validate(p: Record<string, any>) {
  const errs: string[] = []
  if (!p.name) errs.push('name required')
  if (!p.city) errs.push('city required')
  if (!p.country) errs.push('country required')
  if (typeof p.lat !== 'number' || typeof p.lng !== 'number') errs.push('lat/lng required (numbers)')
  if (!Array.isArray(p.types) || p.types.length === 0) errs.push('types[] required (non-empty)')
  if (p.price_level != null && (+p.price_level < 1 || +p.price_level > 5)) errs.push('price_level must be 1..5')
  if (p.cuisines != null && !Array.isArray(p.cuisines)) errs.push('cuisines must be array or null')
  return errs
}

function safeInitClient(): { client?: SupabaseClient; error?: string } {
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return { error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE env vars.' }
  }
  try {
    const client = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    return { client }
  } catch (e: any) {
    return { error: `Failed to init Supabase client: ${e?.message || 'unknown'}` }
  }
}

export async function POST(req: Request) {
  try {
    const ct = req.headers.get('content-type') || ''
    if (!ct.includes('application/json')) {
      return NextResponse.json({ error: 'Use application/json body.' }, { status: 415 })
    }

    let payload: any
    try {
      payload = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    payload = pickAllowed(payload)
    payload.status = payload.status || 'draft'
    payload.rating_source = payload.rating_source || 'manual'

    const errs = validate(payload)
    if (errs.length) {
      return NextResponse.json({ error: 'Validation failed', details: errs }, { status: 400 })
    }

    const { client, error: initErr } = safeInitClient()
    if (initErr) {
      return NextResponse.json({ error: initErr }, { status: 500 })
    }

    const { data, error } = await client!
      .from('places')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      // DB/constraint/RLS errors surface here as JSON
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, place: data }, { status: 201 })
  } catch (e: any) {
    // Final safety net: ALWAYS JSON
    return NextResponse.json({ error: e?.message || 'insert failed' }, { status: 500 })
  }
}

// JSON for other methods
export async function GET()     { return NextResponse.json({ error: 'Use POST.' }, { status: 405 }) }
export async function PUT()     { return NextResponse.json({ error: 'Use POST.' }, { status: 405 }) }
export async function DELETE()  { return NextResponse.json({ error: 'Use POST.' }, { status: 405 }) }