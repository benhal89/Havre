// src/app/plan/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
// Maps script is loaded globally in layout
import { RefreshCw, Mail, Share2, Download, MapPin, Shuffle } from 'lucide-react'
import clsx from 'clsx'

// import Spinner + shared types
import Spinner from './components/Spinner'
import type { Activity as MapActivity, DayPlan as MapDay, Itinerary as MapItinerary } from './components/types'

// ---------------- City hero helpers ----------------
const CITY_HERO: Record<string, string> = {
  paris:
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=2000&q=80',
  london:
    'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=2000&q=80',
  rome:
    'https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?auto=format&fit=crop&w=2000&q=80',
  barcelona:
    'https://images.unsplash.com/photo-1464790719320-516ecd75af6c?auto=format&fit=crop&w=2000&q=80',
}

function cityHeroFor(city?: string) {
  const key = (city || '').toLowerCase().trim()
  return CITY_HERO[key] || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=80'
}

function googleSearchUrl(name: string, city?: string) {
  const q = encodeURIComponent(`${name} ${city || ''}`.trim())
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}

type GoogleDetails = {
  placeId: string | null
  photoUrl: string | null
  googleUrl: string | null
  summary: string | null
  website: string | null
}

function useGoogleDetails(stop: { name: string; city?: string; lat?: number; lng?: number }) {
  const [data, setData] = useState<GoogleDetails | null>(null)

  useEffect(() => {
    let alive = true
    async function run() {
      try {
        const u = new URL('/api/google/place-details', window.location.origin)
        u.searchParams.set('name', stop.name)
        if (stop.city) u.searchParams.set('city', stop.city)
        if (typeof stop.lat === 'number') u.searchParams.set('lat', String(stop.lat))
        if (typeof stop.lng === 'number') u.searchParams.set('lng', String(stop.lng))
        const res = await fetch(u.toString())
        const json = (await res.json()) as GoogleDetails
        if (alive) setData(json)
      } catch {
        if (alive) setData(null)
      }
    }
    run()
    return () => { alive = false }
  }, [stop.name, stop.city, stop.lat, stop.lng])

  return { data }
}

// -------- Static map helpers --------
function staticMapThumb(lat?: number, lng?: number, label: string = '•') {
  const key =
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ||
    ''
  if (!lat || !lng || !key) return null
  const base = 'https://maps.googleapis.com/maps/api/staticmap'
  const params = new URLSearchParams({
    zoom: '15',
    scale: '2',
    size: '640x360',
    maptype: 'roadmap',
    markers: `color:red|label:${encodeURIComponent(label)}|${lat},${lng}`,
    key,
  })
  return `${base}?${params.toString()}`
}

function staticMapForDay(stops: { lat?: number; lng?: number }[]) {
  const key =
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ||
    ''
  if (!key || stops.length === 0) return null
  const base = 'https://maps.googleapis.com/maps/api/staticmap'
  const params = new URLSearchParams({
    scale: '2',
    size: '1200x280',
    maptype: 'roadmap',
    key,
  })
  const markers = stops
    .filter((s) => !!s.lat && !!s.lng)
    .slice(0, 20)
    .map((s, i) => `color:blue|label:${String.fromCharCode(65 + (i % 26))}|${s.lat},${s.lng}`)
  markers.forEach((m) => params.append('markers', m))
  return `${base}?${params.toString()}`
}

// -------- Small UI chip --------
function ChoiceChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/12 text-white px-3 py-1 text-sm backdrop-blur-sm">
      {icon}
      <span className="font-medium drop-shadow-sm">{label}</span>
    </span>
  )
}

// ---------------- Hero with quick adjust ----------------
function HeroTop({
  destination,
  city,
  days,
  setDays,
  pace,
  setPace,
  budget,
  setBudget,
  wake,
  setWake,
  plan,
  onApply,
}: {
  destination: string
  city: string
  days: number
  setDays: (n: number) => void
  pace: 'relaxed' | 'balanced' | 'packed'
  setPace: (p: 'relaxed' | 'balanced' | 'packed') => void
  budget: number
  setBudget: (n: number) => void
  wake: 'early' | 'standard' | 'late'
  setWake: (w: 'early' | 'standard' | 'late') => void
  plan: Itinerary | null
  onApply: () => void
}) {
  const paceLabel = { relaxed: 'Relaxed', balanced: 'Balanced', packed: 'Packed' }[pace]
  const wakeLabel = { early: 'Early bird', standard: 'Standard', late: 'Night owl' }[wake]
  const budgetLabel = ['—', '€', '€€', '€€€', '€€€€', '€€€€€'][budget] || '€€€'

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border bg-white">
      <div className="relative" style={{ height: 360 }}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${cityHeroFor(city)})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white drop-shadow">
            {days}-day trip to {destination}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ChoiceChip icon={<span className="text-xs">⏱</span>} label={paceLabel} />
            <ChoiceChip icon={<span className="text-xs">€</span>} label={`Budget: ${budgetLabel}`} />
            <ChoiceChip icon={<span className="text-xs">☀️</span>} label={wakeLabel} />
          </div>
        </div>
      </div>

      {/* Apply toolbar above sliders */}
      <div className="flex items-center justify-end p-3">
        <button
          onClick={onApply}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Apply changes &amp; regenerate
        </button>
      </div>

      {/* quick adjust controls */}
      <div className="grid gap-4 border-t p-4 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="mb-1 text-xs font-medium text-slate-600">Days</div>
          <input
            type="range"
            min={2}
            max={14}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-full accent-sky-600"
          />
          <div className="mt-1 text-xs text-slate-600">{days} days</div>
        </div>

        <div>
          <div className="mb-1 text-xs font-medium text-slate-600">Pace</div>
          <div className="flex gap-1">
            {(['relaxed', 'balanced', 'packed'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPace(p)}
                className={clsx(
                  'rounded-lg border px-2.5 py-1.5 text-xs',
                  pace === p ? 'bg-sky-600 text-white border-sky-600' : 'hover:bg-slate-50',
                )}
              >
                {p[0].toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1 text-xs font-medium text-slate-600">Budget</div>
          <div className="flex flex-wrap gap-1">
            {[1, 2, 3, 4, 5].map((b) => (
              <button
                key={b}
                onClick={() => setBudget(b)}
                className={clsx(
                  'rounded-lg border px-2.5 py-1.5 text-xs',
                  budget === b ? 'bg-sky-600 text-white border-sky-600' : 'hover:bg-slate-50',
                )}
              >
                {'€'.repeat(b)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1 text-xs font-medium text-slate-600">Daily rhythm</div>
          <div className="flex gap-1">
            {(['early', 'standard', 'late'] as const).map((w) => (
              <button
                key={w}
                onClick={() => setWake(w)}
                className={clsx(
                  'rounded-lg border px-2.5 py-1.5 text-xs',
                  wake === w ? 'bg-sky-600 text-white border-sky-600' : 'hover:bg-slate-50',
                )}
              >
                {w === 'early' ? 'Early' : w === 'late' ? 'Night' : 'Standard'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// --------------- Stop card ---------------
function StopCard({ activity, city }: { activity: MapActivity; city: string }) {
  const name = (activity as any).place?.name || activity.title
  const lat = activity.lat ?? (activity as any).place?.lat
  const lng = activity.lng ?? (activity as any).place?.lng

  const { data } = useGoogleDetails({ name, city, lat, lng })

  const googleUrl = data?.googleUrl || googleSearchUrl(name, city)
  const photoUrl =
    data?.photoUrl ||
    (lat && lng
      ? staticMapThumb(lat, lng)
      : `https://source.unsplash.com/640x360/?${encodeURIComponent(city + ' city')}`)

  return (
    <div className="flex gap-4 rounded-xl border bg-white p-3 hover:shadow-sm">
      {photoUrl ? (
        <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="block shrink-0">
          <img src={photoUrl} alt={name} className="h-28 w-40 rounded-lg object-cover" />
        </a>
      ) : (
        <div className="h-28 w-40 shrink-0 rounded-lg bg-slate-100" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{activity.time || '--:--'}</span>
          {((activity as any).address || (activity as any).place?.address) && (
            <span className="truncate">
              • {((activity as any).address || (activity as any).place?.address)}
            </span>
          )}
        </div>
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate text-base font-semibold text-slate-900 hover:underline"
          title={`Open on Google Maps: ${name}`}
        >
          {name}
        </a>
        {(activity as any).description && (
          <div className="mt-1 line-clamp-2 text-sm text-slate-600">
            {(activity as any).description}
          </div>
        )}
      </div>
    </div>
  )
}

// --------------- Types & helpers ---------------
type Activity = MapActivity & {
  place?: {
    name?: string
    lat?: number
    lng?: number
    address?: string
  }
}
type DayPlan = MapDay
type Itinerary = MapItinerary

function inferType(a: Activity):
  | 'cafe'
  | 'restaurant'
  | 'bar'
  | 'museum'
  | 'gallery'
  | 'park'
  | 'landmark'
  | 'other' {
  const title = (a.title || '').toLowerCase()
  const tags = (((a as any).tags || []) as string[]).map((t) => t.toLowerCase())
  const hay = [title, ...tags].join(' ')
  if (/(café|cafe|coffee|espresso|roaster)/.test(hay)) return 'cafe'
  if (/(restaurant|bistro|brasserie|diner|eatery|ristorante|trattoria)/.test(hay)) return 'restaurant'
  if (/(bar|wine|cocktail|club|nightlife|pub)/.test(hay)) return 'bar'
  if (/(museum|musée|museo)/.test(hay)) return 'museum'
  if (/(gallery|galerie)/.test(hay)) return 'gallery'
  if (/(park|garden|jardin|parc)/.test(hay)) return 'park'
  if (/(landmark|monument|tower|cathedral|basilica|bridge|square)/.test(hay)) return 'landmark'
  return 'other'
}

function summarizeDay(day: DayPlan, idx: number): string {
  const acts = day.activities || []
  if (!acts.length) return `Day ${idx + 1}: Open schedule — feel free to add stops.`
  const first = acts[0]?.title || 'a nice start'
  const second = acts[1]?.title
  const final = acts[acts.length - 1]?.title
  let mood: 'Relaxed' | 'Balanced' | 'Packed' = 'Balanced'
  if (acts.length <= 3) mood = 'Relaxed'
  else if (acts.length >= 6) mood = 'Packed'
  const parts = [`Day ${idx + 1}: ${mood} day starting at ${first}`]
  if (second) parts.push(`, then ${second}`)
  if (final && final !== first && final !== second) parts.push(`, and wrapping up at ${final}`)
  return parts.join('') + '.'
}

// --------------- Page ---------------
export default function PlanPage() {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const destination = params.get('d') || 'Paris'
  const city = params.get('city') || destination
  const autostart = params.get('autostart') === '1'
  const hours = params.get('hours') || 'balanced'
  const pace = params.get('pace') || 'balanced'
  const budget = params.get('budget') || '3'
  const homeName = params.get('home_name') || ''

  const [sDays, setSDays] = useState<number>(Number(params.get('days') || '3'))
  const [sPace, setSPace] = useState<'relaxed' | 'balanced' | 'packed'>(
    ((params.get('pace') as any) || 'balanced') as 'relaxed' | 'balanced' | 'packed',
  )
  const [sBudget, setSBudget] = useState<number>(Number(params.get('budget') || '3'))
  const [sWake, setSWake] = useState<'early' | 'standard' | 'late'>(
    ((params.get('wake') as any) || 'standard') as 'early' | 'standard' | 'late',
  )

  const [plan, setPlan] = useState<Itinerary | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  function updateURLWithPrefs() {
    const u = new URL(window.location.href)
    const sp = u.searchParams
    sp.set('d', destination)
    sp.set('city', city)
    sp.set('pace', sPace)
    sp.set('budget', String(sBudget))
    sp.set('days', String(sDays))
    sp.set('wake', sWake)
    window.history.replaceState({}, '', u.toString())
  }

  useEffect(() => {
    if (autostart && !plan && !loading) void generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autostart])

  async function generate() {
    const interestsParam = params.get('interests') || ''
    const interestsArr = interestsParam
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)

    setLoading(true)
    setErr(null)
    setPlan(null)
    try {
      const res = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          city: params.get('city') || undefined,
          budget: String(sBudget),
          pace: sPace,
          days: sDays,
          wake: sWake,
          interests: interestsArr,
          prompt: params.get('q') || '',
        }),
      })
      const ctype = res.headers.get('content-type') || ''
      if (!ctype.includes('application/json')) {
        const text = await res.text()
        throw new Error(`API returned non-JSON (${res.status}). ${text.slice(0, 120)}`)
      }
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || `Itinerary failed (${res.status})`)
      if (!j?.days || !Array.isArray(j.days)) throw new Error('No days in response.')

      const normalized: Itinerary = {
        ...(j as any),
        days: (j.days as any[]).map((d: any) => ({
          date: d.date,
          activities: (d.activities || []).map((a: any) => ({
            time: a.time || undefined,
            title: a.title || a.name || 'Place',
            description: a.description || undefined,
            tags: a.tags || undefined,
            lat: typeof a.lat === 'number' ? a.lat : undefined,
            lng: typeof a.lng === 'number' ? a.lng : undefined,
            photoUrl: a.photoUrl || null,
            ...(a.address || a.lat || a.lng
              ? { place: { name: a.title || a.name, lat: a.lat, lng: a.lng, address: a.address } }
              : {}),
          })),
        })),
      }
      setPlan(normalized)
    } catch (e: any) {
      setErr(e?.message || 'Failed to generate itinerary.')
    } finally {
      setLoading(false)
    }
  }

  const mailHref = useMemo(() => {
    const subject = encodeURIComponent(`Havre plan: ${destination}`)
    const body = encodeURIComponent(
      plan
        ? plan.days
            .map((d: DayPlan, i: number) => `Day ${i + 1}\n` + d.activities.map((a: Activity) => `  - ${a.time || '--:--'} ${a.title}`).join('\n'))
            .join('\n\n')
        : 'No plan yet.',
    )
    return `mailto:?subject=${subject}&body=${body}`
  }, [plan, destination])

  function copyLink() {
    if (typeof window !== 'undefined') navigator.clipboard?.writeText(window.location.href)
  }

  function exportText() {
    if (!plan) return
    const text = plan.days
      .map((d: DayPlan, i: number) => `Day ${i + 1}\n` + d.activities.map((a: Activity) => `  - ${a.time || '--:--'} ${a.title}`).join('\n'))
      .join('\n\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `havre-${destination.toLowerCase().replace(/\s+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function pickAlternative(current: Activity, mode: 'similar' | 'any'): Activity | null {
    if (!plan) return null
    const pool: Activity[] = plan.days.flatMap((d) => d.activities || [])
    const wanted = inferType(current)
    const filtered = pool.filter((p) => (p.title || '').toLowerCase() !== (current.title || '').toLowerCase())
    if (mode === 'similar') {
      const sameType = filtered.filter((p) => inferType(p) === wanted)
      if (sameType.length) return sameType[Math.floor(Math.random() * sameType.length)]
    }
    if (filtered.length) return filtered[Math.floor(Math.random() * filtered.length)]
    return null
  }

  function swapActivity(di: number, ai: number, mode: 'similar' | 'any') {
    if (!plan) return
    const current = plan.days[di]?.activities?.[ai]
    if (!current) return
    const replacement = pickAlternative(current, mode)
    if (!replacement) return

    setPlan((prev) => {
      if (!prev) return prev
      const next: Itinerary = JSON.parse(JSON.stringify(prev))
      const keepTime = next.days[di].activities[ai].time
      const rep: Activity = {
        ...replacement,
        time: keepTime ?? replacement.time,
      }
      next.days[di].activities.splice(ai, 1, rep)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* top header */}
      <div className="border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm text-slate-500">
              <Link href="/" className="text-sky-700 hover:underline">
                Havre
              </Link>{' '}
              / Planner
            </div>
            <div className="truncate text-lg font-semibold text-slate-900">Planning for {destination}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              {homeName && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
                  <MapPin className="h-3.5 w-3.5" /> {homeName}
                </span>
              )}
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">hours: {hours}</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">pace: {pace}</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">budget: {budget}</span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              onClick={generate}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" /> {loading ? 'Planning…' : 'Regenerate'}
            </button>
            <a
              href={mailHref}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              <Mail className="h-4 w-4" /> Email
            </a>
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              <Share2 className="h-4 w-4" /> Copy link
            </button>
            <button
              onClick={exportText}
              disabled={!plan}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        </div>
      </div>

      {/* hero + quick adjust */}
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <HeroTop
          destination={destination}
          city={city}
          days={sDays}
          setDays={(n) => {
            setSDays(n)
          }}
          pace={sPace}
          setPace={(p) => {
            setSPace(p)
          }}
          budget={sBudget}
          setBudget={(n) => {
            setSBudget(n)
          }}
          wake={sWake}
          setWake={(w) => {
            setSWake(w)
          }}
          plan={plan}
          onApply={() => {
            updateURLWithPrefs()
            generate()
          }}
        />
      </div>

      {/* main */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        {!plan && !loading && (
          <div className="mb-6 rounded-xl border bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-slate-900">Ready to plan?</div>
                <div className="text-sm text-slate-600">We’ll generate a day-by-day plan using your preferences.</div>
              </div>
              <button
                onClick={generate}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
              >
                Generate itinerary
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Spinner label="Planning your days…" />
          </div>
        )}

        {err && <div className="my-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{err}</div>}

        {plan && !loading && (
          <div className="mt-6 space-y-10">
            {plan.days.map((day, di) => {
              const dayStops = (day.activities || [])
                .map((a) => a.place || {})
                .filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number')
              const dayMap = staticMapForDay(dayStops as { lat?: number; lng?: number }[])
              return (
                <section key={di} className="rounded-xl border bg-white">
                  {/* combined header with inline summary */}
                  <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                    <div className="min-w-0 flex items-center gap-3">
                      <div className="text-base font-semibold text-slate-900">Day {di + 1}</div>
                      <div className="hidden md:block h-4 w-px bg-slate-200" />
                      <div className="truncate text-sm text-slate-600">{summarizeDay(day, di)}</div>
                    </div>
                    {dayMap && (
                      <img
                        src={dayMap}
                        alt={`Day ${di + 1} map`}
                        className="hidden md:block h-28 w-auto rounded-md border"
                      />
                    )}
                  </div>

                  {/* activities */}
                  <div className="divide-y">
                    {day.activities.map((a, ai) => (
                      <div key={ai} className="relative p-3">
                        {/* swap icon stack */}
                        <div className="absolute right-3 top-3 flex flex-col gap-1">
                          <button
                            onClick={() => swapActivity(di, ai, 'similar')}
                            className="inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            title="Swap with similar"
                          >
                            <Shuffle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => swapActivity(di, ai, 'any')}
                            className="inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            title="Swap with any"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        </div>

                        <StopCard activity={a} city={destination} />
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}