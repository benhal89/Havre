import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) as string
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      prompt,
      destination,
      budget,
      pace,
      days,
      wake,
      interests,
      user_id,
      style,
      city,
      country,
      source,
    } = body || {}

    const { data, error } = await supabase
      .from('requests')
      .insert({
        prompt: prompt ?? null,
        destination: destination ?? null,
        budget: String(budget ?? ''),
        pace: String(pace ?? ''),
        days: typeof days === 'number' ? days : null,
        wake: String(wake ?? ''),
        interests: Array.isArray(interests) ? interests : null,
        user_id: user_id ?? null,
        style: style ?? null,
        city: city ?? null,
        country: country ?? null,
        // optionally keep the source of request
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, request: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to save request' }, { status: 500 })
  }
}