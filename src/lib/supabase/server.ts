// src/lib/supabase/server.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Anonymous server-side client (safe for read/select & RLS-protected inserts).
 * Does not use cookies.
 */
export function createServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Alias kept for existing imports in API routes.
 */
export function supabaseService(): SupabaseClient {
  return createServerClient()
}

// ---------- Shared types ----------
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