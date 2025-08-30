// src/lib/supabase/client.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Browser Supabase client (persists session) */
export function supabaseBrowser(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true },
  })
}