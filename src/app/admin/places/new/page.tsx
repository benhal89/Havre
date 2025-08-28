'use client'

import { useState } from 'react'
import Link from 'next/link'

type ResolveResponse = {
  name?: string
  address?: string
  city?: string
  country?: string
  lat?: number
  lng?: number
  website?: string | null
  url?: string | null
  phone?: string | null
  rating?: number | null
  price_level?: number | null
  opening_hours?: any | null
  tz?: string | null
  types?: string[]
  cuisines?: string[]
  themes?: string[]
  tags?: string[]
  neighborhood?: string | null
  gyg_url?: string | null
  google_place_id?: string | null   // NEW
}

// ---------- UI option lists ----------
const TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'restaurant', label: '🍽️  Restaurant' },
  { value: 'cafe', label: '☕️  Café' },
  { value: 'bar', label: '🍸  Bar' },
  { value: 'wine_bar', label: '🍷  Wine bar' },
  { value: 'bakery', label: '🥐  Bakery' },
  { value: 'market', label: '🛒  Market' },
  { value: 'museum', label: '🏛️  Museum' },
  { value: 'gallery', label: '🖼️  Gallery' },
  { value: 'theatre', label: '🎭  Theatre' },
  { value: 'landmark', label: '📍  Landmark' },
  { value: 'park', label: '🌳  Park' },
  { value: 'garden', label: '🌿  Garden' },
  { value: 'rooftop', label: '🏙️  Rooftop' },
  { value: 'neighborhood_walk', label: '🚶  Neighborhood walk' },
  { value: 'boutique', label: '🛍️  Boutique' },
  { value: 'spa', label: '💆  Spa' },
  { value: 'event_venue', label: '🎪  Event venue' },
  { value: 'hike', label: '🥾  Hike' },
  { value: 'beach', label: '🏖️  Beach' },
  { value: 'winery', label: '🍇  Winery' },
  { value: 'lookout', label: '🔭  Lookout' },
]

const CUISINE_OPTIONS: string[] = [
  'bistro','neo_bistro','fine_dining','contemporary','italian','japanese','izakaya','ramen','sushi','korean','thai','indian','lebanese','persian','north_african','greek','spanish','seafood','vegan','vegetarian','natural_wine'
]

const THEME_OPTIONS: string[] = [
  'date_night','good_for_solo','family_friendly','rainy_day','sunset','photo_spot','design','architecture','street_art','nightlife'
]

// icon for compact theme buttons (name shows on hover via title)
const THEME_EMOJI: Record<string, string> = {
  date_night: '💞',
  good_for_solo: '👤',
  family_friendly: '👨‍👩‍👧',
  rainy_day: '🌧️',
  sunset: '🌇',
  photo_spot: '📸',
  design: '🎨',
  architecture: '🏛️',
  street_art: '🧱',
  nightlife: '🌙',
}

export default function AddPlacePage() {
  const [gmapsUrl, setGmapsUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resolved, setResolved] = useState<ResolveResponse | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    country: '',
    lat: '' as string | number,
    lng: '' as string | number,
    website: '',
    url: '',
    phone: '',
    rating: '' as string | number,
    price_level: 3 as string | number,
    opening_hours: '' as string,
    tz: 'Europe/Paris',
    types: [] as string[],
    cuisines: [] as string[],
    themes: [] as string[],
    tags: [] as string[],
    neighborhood: '',
    gyg_url: '',
    adventure_level: 3 as string | number,
    nature_culture: 0 as string | number,
    locality: 0 as string | number,
    social_vibe: 0 as string | number,
    status: 'active' as 'active' | 'hidden' | 'draft',
    google_place_id: '' as string | null, // NEW
  })

  function fillFromResolved(r: ResolveResponse) {
    setForm((prev) => ({
      ...prev,
      name: r.name ?? prev.name,
      address: r.address ?? prev.address,
      city: r.city ?? prev.city,
      country: r.country ?? prev.country,
      lat: r.lat ?? prev.lat,
      lng: r.lng ?? prev.lng,
      website: r.website ?? prev.website,
      url: r.url ?? prev.url ?? gmapsUrl,
      phone: r.phone ?? prev.phone,
      rating: r.rating ?? prev.rating,
      price_level: r.price_level ?? prev.price_level,
      opening_hours: r.opening_hours ? JSON.stringify(r.opening_hours, null, 2) : prev.opening_hours,
      tz: r.tz ?? prev.tz,
      types: r.types ?? prev.types,
      cuisines: r.cuisines ?? prev.cuisines,
      themes: r.themes ?? prev.themes,
      tags: r.tags ?? prev.tags,
      neighborhood: r.neighborhood ?? prev.neighborhood,
      gyg_url: r.gyg_url ?? prev.gyg_url,
      google_place_id: (r.google_place_id ?? prev.google_place_id) as any, // NEW
    }))
  }

  async function onResolve(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResolved(null)
    setSavedId(null)

    if (!gmapsUrl.trim()) {
      setError('Please paste a Google Maps place link.')
      return
    }

    try {
      setLoading(true)
      const u = new URL('/api/admin/resolve-place', window.location.origin)
      u.searchParams.set('url', gmapsUrl.trim())

      const res = await fetch(u.toString())
      const ctype = res.headers.get('content-type') || ''
      const isJson = ctype.includes('application/json')
      const data = isJson ? await res.json() : null

      if (!res.ok) throw new Error(data?.error || `Resolve failed (${res.status})`)

      setResolved(data as ResolveResponse)
      fillFromResolved(data as ResolveResponse)
    } catch (err: any) {
      setError(err?.message || 'Failed to resolve place.')
    } finally {
      setLoading(false)
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSavedId(null)

    if (!form.name || !form.city || !form.country || !form.lat || !form.lng) {
      setError('Please provide name, city, country, and valid coordinates.')
      return
    }

    try {
      setSaving(true)
      const res = await fetch('/api/admin/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          address: form.address || null,
          city: form.city,
          country: form.country,
          lat: Number(form.lat),
          lng: Number(form.lng),
          website: form.website || null,
          url: form.url || null,
          phone: form.phone || null,
          rating: form.rating ? Number(form.rating) : null,
          price_level: form.price_level ? Number(form.price_level) : null,
          opening_hours: form.opening_hours ? safeJson(form.opening_hours) : null,
          tz: form.tz || 'Europe/Paris',
          types: form.types,
          cuisines: form.cuisines,
          themes: form.themes,
          tags: form.tags,
          neighborhood: form.neighborhood || null,
          gyg_url: form.gyg_url || null,
          adventure_level: Number(form.adventure_level || 3),
          nature_culture: Number(form.nature_culture || 0),
          locality: Number(form.locality || 0),
          social_vibe: Number(form.social_vibe || 0),
          status: form.status,
          google_place_id: form.google_place_id || null, // NEW
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to save place.')
      setSavedId(json?.id || 'OK')
    } catch (err: any) {
      setError(err?.message || 'Failed to save place.')
    } finally {
      setSaving(false)
    }
  }

  function updateField<K extends keyof typeof form>(key: K, val: any) {
    setForm((p) => ({ ...p, [key]: val }))
  }

  function toggleInArray(key: 'types' | 'cuisines' | 'themes' | 'tags', value: string) {
    setForm((p) => {
      const arr = new Set(p[key])
      if (arr.has(value)) arr.delete(value)
      else arr.add(value)
      return { ...p, [key]: Array.from(arr) as string[] }
    })
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sky-700 hover:underline">← Back to home</Link>
      </div>

      <h1 className="text-2xl font-semibold text-slate-900">Add a place</h1>
      <p className="mt-1 text-slate-600">
        Paste a Google Maps place link. We’ll prefill everything we can.
      </p>

      <form onSubmit={onResolve} className="mt-4 flex items-center gap-2">
        <input
          type="url"
          placeholder="https://maps.google.com/?cid=..."
          value={gmapsUrl}
          onChange={(e) => setGmapsUrl(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
          required
        />
        <button
          type="submit"
          disabled={loading || !gmapsUrl}
          className="rounded-lg bg-sky-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? 'Adding…' : 'Add place'}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {resolved && (
        <div className="mt-8 rounded-xl border bg-white p-5">
          {/* Preview card */}
          <div className="flex items-start gap-4">
            {(resolved as any)?._photo && (
              <img
                src={(resolved as any)._photo}
                alt={resolved?.name || 'preview'}
                className="h-32 w-48 rounded-lg object-cover border"
              />
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold text-slate-900 truncate">
                {form.name || resolved?.name || 'New place'}
              </h2>
              {(resolved as any)?._summary && (
                <p className="mt-1 text-sm text-slate-700 max-w-2xl">
                  {(resolved as any)._summary}
                </p>
              )}
            </div>
          </div>

          {/* Minimal form */}
          <form onSubmit={onSave} className="mt-6">
            {/* Activity type & Price level */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Activity type">
                <select
                  className="input"
                  value={form.types[0] || ''}
                  onChange={(e) => {
                    const v = e.target.value
                    updateField('types', v ? [v, ...form.types.filter((x) => x !== v)] : [])
                  }}
                  required
                >
                  <option value="">Select a type…</option>
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Price level (1–5)">
                <div className="flex gap-2">
                  {[1,2,3,4,5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => updateField('price_level', n)}
                      className={`rounded-md border px-3 py-1.5 text-sm ${Number(form.price_level)===n ? 'bg-sky-600 text-white border-sky-600' : 'hover:bg-slate-50'}`}
                      aria-pressed={Number(form.price_level)===n}
                    >
                      {'€'.repeat(n)}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {/* Read-only main info */}
            <Field label="Website">
              <input className="input bg-slate-50" readOnly value={form.website} />
            </Field>
            <Field label="Address">
              <input className="input" value={form.address} onChange={(e) => updateField('address', e.target.value)} />
            </Field>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="City">
                <input className="input bg-slate-50" readOnly value={form.city} />
              </Field>
              <Field label="Country">
                <input className="input bg-slate-50" readOnly value={form.country} />
              </Field>
              <Field label="Google Maps URL">
                <input className="input" value={form.url} onChange={(e) => updateField('url', e.target.value)} />
              </Field>
            </div>

            {/* Cuisines: from Google (read-only) OR editable fallback */}
            {(['restaurant','cafe','bar','wine_bar','bakery','market'] as string[]).includes(form.types[0] || '') && (
              form.cuisines && form.cuisines.length > 0 ? (
                <div className="md:col-span-2">
                  <div className="text-sm font-medium text-slate-700">Cuisines (from Google)</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {form.cuisines.map((c) => (
                      <span
                        key={c}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                        title={c}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <ArrayPick
                  label="Cuisines (optional)"
                  options={CUISINE_OPTIONS}
                  values={form.cuisines}
                  onToggle={(v) => toggleInArray('cuisines', v)}
                />
              )
            )}

            {/* Themes as icon row */}
            <ThemeIconRow
              values={form.themes}
              onToggle={(v) => toggleInArray('themes', v)}
            />

            <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-white disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save place'}
              </button>
            </div>
          </form>
        </div>
      )}

      {savedId && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Place saved!
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-slate-800">{label}</span>
      <div className="mt-1">{children}</div>
      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(226 232 240);
          padding: 0.5rem 0.75rem;
        }
      `}</style>
    </label>
  )
}

function ArrayPick({
  label,
  options,
  values,
  onToggle,
}: {
  label: string
  options: string[]
  values: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div className="md:col-span-2">
      <div className="text-sm font-medium text-slate-700">{label}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = values.includes(opt)
          return (
            <button
              type="button"
              key={opt}
              onClick={() => onToggle(opt)}
              className={`rounded-full border px-3 py-1 text-sm ${
                active ? 'bg-sky-600 text-white border-sky-600' : 'hover:bg-slate-50'
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ThemeIconRow({
  values,
  onToggle,
}: {
  values: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div className="md:col-span-2">
      <div className="text-sm font-medium text-slate-700 mb-2">Themes (optional)</div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {Object.keys(THEME_EMOJI).map((key) => {
          const active = values.includes(key)
          return (
            <button
              key={key}
              type="button"
              title={key.replace(/_/g, ' ')} // shows name on hover
              onClick={() => onToggle(key)}
              className={[
                'h-9 w-9 shrink-0 rounded-full border flex items-center justify-center',
                active ? 'bg-sky-600 text-white border-sky-600' : 'bg-white hover:bg-slate-50'
              ].join(' ')}
              aria-pressed={active}
            >
              <span className="text-base leading-none">{THEME_EMOJI[key]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function safeJson(s: string) {
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}