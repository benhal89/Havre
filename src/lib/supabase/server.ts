// src/lib/supabase/server.ts
import { cookies } from 'next/headers'

type CookieOptions = {
  domain?: string
  expires?: Date
  httpOnly?: boolean
  maxAge?: number
  path?: string
  sameSite?: 'strict' | 'lax' | 'none'
  secure?: boolean
}
import { createServerClient } from '@supabase/ssr'

export async function supabaseServer() {
  // Next 15: must await dynamic APIs once
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Use getAll to avoid repeated cookies().get(...) hints
        getAll() {
          return cookieStore.getAll()
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      } as any,
    }
  )
}