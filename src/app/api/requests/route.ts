// src/app/api/requests/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = createClient()

    const payload = {
      prompt: body?.prompt ?? null,
      destination: body?.destination ?? null,
      budget: body?.budget != null ? String(body.budget) : null,
      pace: body?.pace ?? null,
      days: typeof body?.days === 'number' ? body.days : null,
      wake: body?.wake ?? null,
      interests: Array.isArray(body?.interests) ? body.interests : null,
      style: body?.style ?? null,
      city: body?.city ?? null,
      country: body?.country ?? null,
      user_id: body?.user_id ?? null,
    }

    const { data, error } = await supabase
      .from('requests')
      .insert(payload)
      .select('id')
      .single()

    if (error) throw error
    return NextResponse.json({ id: data.id })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Insert failed' },
      { status: 500 },
    )
  }
}