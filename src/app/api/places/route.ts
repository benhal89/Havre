import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// IMPORTANT: use the SERVICE ROLE key only on the server.
// Add these to your .env.local and your hosting env vars:
//   SUPABASE_URL=https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE=eyJhbGciOi...
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_ROLE  = process.env.SUPABASE_SERVICE_ROLE

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

if (!SUPABASE_URL) console.warn('SUPABASE_URL missing')
if (!SERVICE_ROLE) console.warn('SUPABASE_SERVICE_ROLE missing (inserts may fail if RLS blocks anon)')

function adminClient() {
  return createClient(SUPABASE_URL!, SERVICE_ROLE!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// Whitelist the columns your table actually has.
// Remove or add keys to match your schema exactly.
const ALLOWED_KEYS = new Set([
  'name',
  'city',
  'country',
  'neighborhood',
  'address',
  'lat',
  'lng',
  'price_level',
  'types',         // text[]
  'cuisines',      // text[] (nullable)
  'description',
  'website',
  'rating_source',
  'status',
])

function pickAllowed(input: Record<string, any>) {
  const out: Record<string, any> = {}
  for (const k of Object.keys(input)) {
    if (ALLOWED_KEYS.has(k)) out[k] = input[k]
  }
  return out
}

function validate(payload: Record<string, any>) {
  const errs: string[] = []

  if (!payload.name || typeof payload.name !== 'string') errs.push('name required')
  if (!payload.city || typeof payload.city !== 'string') errs.push('city required')
  if (!payload.country || typeof payload.country !== 'string') errs.push('country required')

  if (typeof payload.lat !== 'number' || typeof payload.lng !== 'number') {
    errs.push('lat and lng required (numbers)')
  }

  if (payload.price_level != null) {
    const n = Number(payload.price_level)
    if (!Number.isFinite(n) || n < 1 || n > 5) errs.push('price_level must be 1..5')
  }

  if (!Array.isArray(payload.types) || payload.types.length === 0) {
    errs.push('types must be a non-empty array of strings')
  }

  if (payload.cuisines != null && !Array.isArray(payload.cuisines)) {
    errs.push('cuisines must be an array or null')
  }

  return errs
}

export async function POST(req: Request) {
  try {
    const ctype = req.headers.get('content-type') || ''
    if (!ctype.includes('application/json')) {
      return NextResponse.json({ error: 'Use application/json body.' }, { status: 415 })
    }
    const body = await req.json()

    // Only keep allowed columns
    const payload = pickAllowed(body)

    // Default some safe values
    if (!payload.status) payload.status = 'draft'
    if (!payload.rating_source) payload.rating_source = 'manual'

    // Validate against your expectations
    const errs = validate(payload)
    if (errs.length) {
      return NextResponse.json({ error: 'Validation failed', details: errs }, { status: 400 })
    }

    // Insert (SERVICE ROLE bypasses RLS; safer/easier for admin tools)
    const supa = adminClient()
    const { data, error } = await supa
      .from('places')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      // surface DB errors as JSON (e.g., check constraints)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, place: data }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'insert failed' }, { status: 500 })
  }
}

// JSON for non‑POST methods
export async function GET()    { return NextResponse.json({ error: 'Use POST.' }, { status: 405 }) }
export async function PUT()    { return NextResponse.json({ error: 'Use POST.' }, { status: 405 }) }
export async function DELETE() { return NextResponse.json({ error: 'Use POST.' }, { status: 405 }) }