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
import AreaDayCard, { AreaSlot } from './components/AreaDayCard'

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
  interests,
  actions,
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
  interests: string
  actions: {
    onRegenerate: () => void
    regenerating: boolean
    mailHref: string
    onCopyLink: () => void
    onExport: () => void
  }
}) {
  const paceLabel = { relaxed: 'Relaxed', balanced: 'Balanced', packed: 'Packed' }[pace]
  const wakeLabel = { early: 'Early bird', standard: 'Standard', late: 'Night owl' }[wake]
  const budgetLabel = ['—', '€', '€€', '€€€', '€€€€', '€€€€€'][budget] || '€€€'
  const summaries =
    plan?.days?.slice(0, 3).map((d, i) => summarizeDay(d as any, i)) ?? []

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border bg-white">
      <div className="relative" style={{ height: 360 }}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${cityHeroFor(city)})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
        {/* Actions over hero image */}
        <div className="absolute right-3 top-3 flex items-center gap-2">
          <button
            onClick={actions.onRegenerate}
            disabled={actions.regenerating}
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/20 px-3 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/30 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" /> {actions.regenerating ? 'Planning…' : 'Regenerate'}
          </button>
          <a
            href={actions.mailHref}
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/20 px-3 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/30"
          >
            <Mail className="h-4 w-4" /> Email
          </a>
          <button
            onClick={actions.onCopyLink}
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/20 px-3 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/30"
          >
            <Share2 className="h-4 w-4" /> Copy link
          </button>
          <button
            onClick={actions.onExport}
            disabled={!plan}
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/20 px-3 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/30 disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white drop-shadow">
            {days}-day trip to {destination}
          </h1>
          {summaries.length > 0 && (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/90 drop-shadow">
              {summaries.join(' ')}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ChoiceChip icon={<span className="text-xs">⏱</span>} label={paceLabel} />
            <ChoiceChip icon={<span className="text-xs">€</span>} label={`Budget: ${budgetLabel}`} />
            <ChoiceChip icon={<span className="text-xs">☀️</span>} label={wakeLabel} />
            {interests && <ChoiceChip icon={<span className="text-xs">⭐</span>} label={interests} />}
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

// ===== Area Explorer types & helpers =====
type SlotKey = 'cafe' | 'gallery' | 'lunch' | 'walk' | 'bar' | 'dinner'

type AreaDay = {
  areaName: string
  areaSummary: string
  coverUrl: string | null
  slots: Partial<Record<SlotKey, Activity | null>>
  stops: { lat?: number; lng?: number }[]
}

function extractNeighborhoodFromText(s?: string): string | null {
  if (!s) return null
  const parts = s.split(',').map((p) => p.trim())
  if (parts.length >= 2) return parts[0]
  return null
}

function areaNameFromDay(day: DayPlan, fallbackCity: string): string {
  const acts = day.activities || []
  for (const a of acts) {
    const n1 = (a as any).neighborhood as string | undefined
    if (n1) return n1
    const addr = ((a as any).place?.address || (a as any).address) as string | undefined
    const n2 = extractNeighborhoodFromText(addr)
    if (n2) return n2
  }
  return fallbackCity
}

function slotForActivity(a: Activity): SlotKey | null {
  const t = inferType(a)
  if (t === 'cafe') return 'cafe'
  if (t === 'gallery') return 'gallery'
  if (t === 'restaurant') return (a.title?.toLowerCase().includes('lunch') ? 'lunch' : 'dinner')
  if (t === 'bar') return 'bar'
  if (t === 'park' || t === 'landmark' || t === 'other' || t === 'museum') return 'walk'
  return null
}

function coverForArea(areaName: string, city: string): string {
  const q = encodeURIComponent(`${areaName} ${city} street`)
  return `https://source.unsplash.com/1200x300/?${q}`
}

function buildAreaDayFromDay(day: DayPlan, city: string): AreaDay {
  const areaName = areaNameFromDay(day, city)
  const summary = `Explore ${areaName} — cafés, culture and good food.`
  const slots: Partial<Record<SlotKey, Activity | null>> = {}
  for (const a of (day.activities || [])) {
    const key = slotForActivity(a as Activity)
    if (!key) continue
    if (!slots[key]) slots[key] = a as Activity // first candidate per slot
  }
  const stops = (day.activities || [])
    .map((a) => (a as any).place || {})
    .filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number') as {
      lat?: number; lng?: number;
    }[]
  return {
    areaName,
    areaSummary: summary,
    coverUrl: coverForArea(areaName, city),
    slots,
    stops,
  }
}

// ===== AreaDayCard & PlaceBlock =====

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
  const interestsParam = (params.get('interests') || '').split(',').map(s => s.trim()).filter(Boolean)
  const interestsLabel = interestsParam.slice(0, 3).join(', ')

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

  // Prepare Area Explorer data for external AreaDayCard
  const areaDays = useMemo(() => {
    if (!plan) return [] as { areaName: string; areaHero: string | null; summary: string; slots: AreaSlot[] }[]
    return plan.days.map((day) => {
      const a = buildAreaDayFromDay(day, destination)
      const slotsArr: AreaSlot[] = (Object.entries(a.slots) as [SlotKey, Activity | null][])
        .map(([key, activity]) => ({ key, activity } as unknown as AreaSlot))
      return {
        areaName: a.areaName,
        areaHero: a.coverUrl,
        summary: a.areaSummary,
        slots: slotsArr,
      }
    })
  }, [plan, destination])

  // Swap handler used by AreaDayCard callbacks
  function swapPlace({ mode, dayIdx, slotKey }: { mode: 'similar' | 'any'; dayIdx: number; slotKey: SlotKey }) {
    if (!plan) return
    setPlan((prev) => {
      if (!prev) return prev
      const next: Itinerary = JSON.parse(JSON.stringify(prev))
      const pool: Activity[] = (next.days[dayIdx].activities || []) as Activity[]

      // Determine current activity for the slot
      const currentArea = buildAreaDayFromDay(next.days[dayIdx], destination)
      const current = (currentArea.slots as Partial<Record<SlotKey, Activity | null>>)[slotKey] || null
      if (!current) return next

      const wanted = mode === 'similar' ? slotForActivity(current) : null
      const filtered = pool.filter((p) => (p.title || '') !== (current.title || ''))
      let choice: Activity | undefined
      if (mode === 'similar' && wanted) {
        const same = filtered.filter((p) => slotForActivity(p) === wanted)
        if (same.length) choice = same[Math.floor(Math.random() * same.length)]
      }
      if (!choice && filtered.length) choice = filtered[Math.floor(Math.random() * filtered.length)]
      if (!choice) return next

      const idx = (next.days[dayIdx].activities || []).findIndex((a) => (a as Activity).title === (current as Activity).title)
      if (idx >= 0) next.days[dayIdx].activities[idx] = choice
      return next
    })
  }

  return (
    <div className="min-h-screen bg-white">

      {/* hero + quick adjust */}
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <HeroTop
  destination={destination}
  city={city}
  days={sDays}
  setDays={(n) => setSDays(n)}
  pace={sPace}
  setPace={(p) => setSPace(p)}
  budget={sBudget}
  setBudget={(n) => setSBudget(n)}
  wake={sWake}
  setWake={(w) => setSWake(w)}
  plan={plan}
  onApply={() => { updateURLWithPrefs(); generate() }}
  interests={interestsLabel}
  actions={{
    onRegenerate: generate,
    regenerating: loading,
    mailHref,
    onCopyLink: copyLink,
    onExport: exportText,
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
          <div className="mt-6 space-y-8">
            {areaDays.map((d, i) => (
              <AreaDayCard
                key={i}
                dayIndex={i}
                area={{ name: d.areaName, imageUrl: d.areaHero || undefined }}
                summary={d.summary}
                slots={d.slots as AreaSlot[]}
                onSwapSimilar={(dayIdx, slotKey) => swapPlace({ mode: 'similar', dayIdx, slotKey: slotKey as SlotKey })}
                onSwapAny={(dayIdx, slotKey) => swapPlace({ mode: 'any', dayIdx, slotKey: slotKey as SlotKey })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}