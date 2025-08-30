
/**
 * Server-side Supabase client (no cookies needed for read-only endpoints).
 * Reads standard env vars you already use elsewhere.
 */
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
// src/lib/supabaseServer.ts
import { createClient } from '@supabase/supabase-js'

/**
 * Lightweight server-side Supabase client that does NOT touch Next.js cookies.
 * Use for public, read-mostly endpoints (e.g., itinerary building).
 */
export function supabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // anon is fine for selects & open inserts with RLS
  return createClient(url, key, { auth: { persistSession: false } })
}

export type PlaceRow = {
  id: string
  name: string
  description: string | null
  address: string | null
  neighborhood: string | null
  city: string
  country: string
  lat: number
  lng: number
  tags: string[] | null
  types: string[] | null
  price_level: number | null
}

export type RequestInsert = {
  city: string
  destination?: string | null
  days: number
  pace: 'relaxed' | 'balanced' | 'packed'
  budget: number | string
  wake: 'early' | 'standard' | 'late'
  interests: string[]
  prompt?: string
  style?: string | null
  country?: string | null
  source?: string | null
}