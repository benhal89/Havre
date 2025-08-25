#!/usr/bin/env bash
set -euo pipefail

# Detect whether the project uses src/*
BASE="."
if [ -d "src" ]; then BASE="src"; fi
APP="${BASE}/app"
LIB="${BASE}/lib/supabase"

echo "👉 Using base dir: ${BASE}"
echo "👉 Installing packages..."
npm i @supabase/supabase-js @supabase/ssr zod

echo "👉 Creating folders..."
mkdir -p "${LIB}" "${APP}/(auth)/login" "${APP}/plan" "${APP}/api/itinerary"

echo "👉 Writing ${LIB}/client.ts"
cat > "${LIB}/client.ts" <<'TS'
import { createBrowserClient } from '@supabase/ssr'

export const supabaseBrowser = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
TS

echo "👉 Writing ${LIB}/server.ts"
cat > "${LIB}/server.ts" <<'TS'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export const supabaseServer = () => {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          cookieStore.set({ name, value, ...options })
        },
        remove: (name: string, options: any) => {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
TS

echo "👉 Writing ${APP}/(auth)/login/page.tsx"
cat > "${APP}/(auth)/login/page.tsx" <<'TSX'
'use client'
import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = supabaseBrowser()

  async function sendMagicLink() {
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/` },
    })
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      {sent ? (
        <p>Check your inbox for the magic link.</p>
      ) : (
        <>
          <input
            type="email"
            className="w-full border rounded px-3 py-2"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            onClick={sendMagicLink}
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            disabled={!email}
          >
            Send magic link
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </>
      )}
    </div>
  )
}
TSX

echo "👉 Writing ${APP}/plan/page.tsx"
cat > "${APP}/plan/page.tsx" <<'TSX'
'use client'
import { useState } from 'react'

export default function PlanPage() {
  const [destination, setDestination] = useState('Paris')
  const [dates, setDates] = useState('2025-09-10 to 2025-09-14')
  const [interests, setInterests] = useState('food, art, hidden gems')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [err, setErr] = useState<string | null>(null)

  async function generate() {
    try {
      setLoading(true)
      setErr(null)
      const res = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, dates, interests }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Request failed')
      setResult(json)
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Plan your trip</h1>
      <input
        className="w-full border rounded px-3 py-2"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        placeholder="Destination"
      />
      <input
        className="w-full border rounded px-3 py-2"
        value={dates}
        onChange={(e) => setDates(e.target.value)}
        placeholder="Dates (YYYY-MM-DD to YYYY-MM-DD)"
      />
      <textarea
        className="w-full border rounded px-3 py-2"
        value={interests}
        onChange={(e) => setInterests(e.target.value)}
        placeholder="Interests"
      />
      <button
        onClick={generate}
        disabled={loading}
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
      >
        {loading ? 'Planning…' : 'Generate itinerary'}
      </button>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {result && (
        <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
TSX

echo "👉 Writing ${APP}/api/itinerary/route.ts"
cat > "${APP}/api/itinerary/route.ts" <<'TS'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '@/lib/supabase/server'

const Body = z.object({
  destination: z.string().min(2),
  dates: z.string().min(3),
  interests: z.string().min(2),
})

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json())
    const supabase = supabaseServer()

    // 1) Embedding from interests
    const embRes = await fetch('https://api.mistral.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.MISTRAL_EMBED_MODEL,
        input: body.interests,
      }),
    }).then((r) => r.json())
    const embedding = embRes?.data?.[0]?.embedding
    if (!embedding) return NextResponse.json({ error: 'Embedding failed' }, { status: 500 })

    // 2) Vector search via RPC (see scripts/supabase.sql)
    const { data: places, error } = await supabase.rpc('search_places', {
      query_embedding: embedding,
      match_count: 12,
    })
    if (error) console.error(error)

    // 3) Chat with Mistral
    const system = `You are a professional travel concierge. Create a feasible, paced itinerary using the provided POIs. Return strict JSON with days[], activities[], and Google Maps links.`
    const userPayload = {
      destination: body.destination,
      dates: body.dates,
      interests: body.interests,
      pois: places ?? [],
    }

    const chat = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.MISTRAL_CHAT_MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: JSON.stringify(userPayload) },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    }).then((r) => r.json())

    const content = chat?.choices?.[0]?.message?.content
    const json = content ? JSON.parse(content) : { itinerary: [] }
    return NextResponse.json(json)
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'error' }, { status: 400 })
  }
}
TS

echo "👉 Ensuring .env.local exists (placeholders)"
if [ ! -f .env.local ]; then
  cat > .env.local <<'ENV'
# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace_with_long_random

# Supabase
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY

# Stripe (add later)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_MONTHLY=price_xxx
STRIPE_PRICE_ANNUAL=price_xxx

# Mistral
MISTRAL_API_KEY=YOUR_MISTRAL_KEY
MISTRAL_CHAT_MODEL=mistral-large-latest
MISTRAL_EMBED_MODEL=mistral-embed
ENV
fi

echo "👉 Writing scripts/supabase.sql (run this in Supabase SQL editor)"
cat > scripts/supabase.sql <<'SQL'
create extension if not exists vector;

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  country text,
  lat double precision,
  lng double precision,
  tags text[],
  summary text,
  url text,
  created_at timestamptz default now()
);

create table if not exists public.place_embeddings (
  place_id uuid primary key references public.places(id) on delete cascade,
  embedding vector(1024)
);

create index if not exists idx_place_embed on public.place_embeddings
using ivfflat (embedding vector_cosine_ops);

create or replace function public.search_places(query_embedding vector, match_count int)
returns table (
  id uuid,
  name text,
  city text,
  country text,
  lat double precision,
  lng double precision,
  tags text[],
  summary text,
  url text,
  similarity float
) language sql stable as $$
  select p.id, p.name, p.city, p.country, p.lat, p.lng, p.tags, p.summary, p.url,
         1 - (pe.embedding <-> query_embedding) as similarity
  from public.place_embeddings pe
  join public.places p on p.id = pe.place_id
  order by pe.embedding <-> query_embedding
  limit match_count;
$$;

grant execute on function public.search_places(vector,int) to anon, authenticated;
SQL

echo "✅ Done.

NEXT:
1) Open Supabase → SQL → paste & run: scripts/supabase.sql
2) Open .env.local and set your SUPABASE + MISTRAL keys
3) Start: npm run dev
4) Visit http://localhost:3000/plan
"
