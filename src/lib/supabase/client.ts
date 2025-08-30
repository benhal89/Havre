// Browser/Client Supabase (anonymous). Use in client components when needed.
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !ANON_KEY) {
  console.warn(
    '[supabase/client] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  )
}

export function createClient() {
  return createSupabaseClient(SUPABASE_URL!, ANON_KEY!, {
    auth: { persistSession: true },
  })
}