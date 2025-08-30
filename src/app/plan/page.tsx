// src/app/plan/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
// Maps script is loaded globally in layout
import { RefreshCw, Mail, Share2, Download, MapPin, Shuffle } from 'lucide-react'
import clsx from 'clsx'
import { useSearchParams } from 'next/navigation'

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
  // Optional autostart if autostart=1 is present in the URL
  useEffect(() => {
    const autostart = (search?.get('autostart') === '1');
    if (autostart) {
      persistRequest();
      if (mode === 'areas') generateAreas();
      else generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Helper to persist the current request to /api/requests
  async function persistRequest() {
    try {
      await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city,
          destination: city,
          days,
          pace,
          budget,
          wake: sWake,
          interests: interestsParam,
          source: 'plan_page',
        }),
      })
    } catch {
      // non-blocking; ignore errors
    }
  }
  // ---- URL params (must be defined before first use) ----
  const search = useSearchParams();
  const city = (search?.get('city') || search?.get('d') || 'Paris').trim();
  const sDays = Math.max(1, Number(search?.get('days') || '3'));
  const sBudget = Math.min(5, Math.max(1, Number(search?.get('budget') || '3')));
  const sPace = (search?.get('pace') as 'relaxed'|'balanced'|'packed') || 'balanced';
  const interestsParam = (search?.get('interests') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  // State for days, pace, budget (with setters)
  const [days, setDays] = useState<number>(sDays);
  const [pace, setPace] = useState<'relaxed' | 'balanced' | 'packed'>(sPace);
  const [budget, setBudget] = useState<number>(sBudget);
  // interestsLabel for HeroTop
  const interestsLabel = interestsParam.slice(0, 3).join(', ');
  const [error, setError] = useState<string | null>(null);
  // --- AreaDayGroups state for new API structure ---
  const [areaDayGroups, setAreaDayGroups] = useState<any[][]>([])

  // Fetch areaDayGroups from new API when city, days, budget, pace, or interests change
  useEffect(() => {
    async function run() {
      try {
        setLoading(true);
        await loadAreaDays({
          city,
          days: sDays,
          budget: sBudget,
          pace: sPace,
          interests: interestsParam,
        });
      } finally {
        setLoading(false);
      }
    }
    run();
    // Re-run if URL params change
  }, [city, sDays, sBudget, sPace, interestsParam.join(',')]);
  // Remove all params-based variables and use only the new ones above
  const [sWake, setSWake] = useState<'early' | 'standard' | 'late'>('standard');
  const [plan, setPlan] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(false);
  // (removed duplicate error/setError declaration)

  // --- Mode & area-mode results (keeps itinerary as default)
  const initialMode = (search?.get('mode') === 'areas' ? 'areas' : 'itinerary') as 'areas' | 'itinerary';
  const [mode, setMode] = useState<'areas' | 'itinerary'>(initialMode);
  // Helper to load area days from API
  async function loadAreaDays(params: {
    city: string;
    days: number;
    budget: number;
    pace: 'relaxed' | 'balanced' | 'packed';
    interests: string[];
  }) {
    const u = new URL('/api/area/suggest', window.location.origin);
    u.searchParams.set('city', params.city);
    u.searchParams.set('days', String(params.days));
    u.searchParams.set('budget', String(params.budget));
    u.searchParams.set('pace', params.pace);
    if (params.interests.length) u.searchParams.set('interests', params.interests.join(','));
    const r = await fetch(u.toString());
    if (!r.ok) throw new Error(await r.text());
    const j = await r.json();
    setAreaDayGroups(j.dayGroups);
  }

  function updateURLWithPrefs() {
    const u = new URL(window.location.href)
    const sp = u.searchParams
    sp.set('city', city)
    sp.set('pace', sPace)
    sp.set('budget', String(sBudget))
    sp.set('days', String(sDays))
    sp.set('wake', sWake)
    window.history.replaceState({}, '', u.toString())
  }

  // Remove autostart logic (not needed with new param-driven approach)

  // Generate AREAS view (for now, it reuses generate() to fill plan and derive areaDays)
  async function generateAreas() {
    await generate()
  }

  // Generate the full itinerary (server call), then we derive areaDays from it
  async function generate() {
    // This function is now a stub or can be refactored to use city, sDays, sBudget, sPace, sWake, interestsParam
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const res = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city,
          budget: String(sBudget),
          pace: sPace,
          days: sDays,
          wake: sWake,
          interests: interestsParam,
        }),
      });
      const ctype = res.headers.get('content-type') || '';
      if (!ctype.includes('application/json')) {
        const text = await res.text();
        throw new Error(`API returned non-JSON (${res.status}). ${text.slice(0, 120)}`);
      }
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || `Itinerary failed (${res.status})`);
      if (!j?.days || !Array.isArray(j.days)) throw new Error('No days in response.');
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
      };
      setPlan(normalized);
    } catch (e: any) {
      setError(e?.message || 'Failed to generate itinerary.');
    } finally {
      setLoading(false);
    }
  }

  const mailHref = useMemo(() => {
    const subject = encodeURIComponent(`Havre plan: ${city}`);
    const body = encodeURIComponent(
      plan
        ? plan.days
            .map((d: DayPlan, i: number) => `Day ${i + 1}\n` + d.activities.map((a: Activity) => `  - ${a.time || '--:--'} ${a.title}`).join('\n'))
            .join('\n\n')
        : 'No plan yet.',
    );
    return `mailto:?subject=${subject}&body=${body}`;
  }, [plan, city]);

  function copyLink() {
    if (typeof window !== 'undefined') navigator.clipboard?.writeText(window.location.href)
  }

  function exportText() {
    if (!plan) return;
    const text = plan.days
      .map((d: DayPlan, i: number) => `Day ${i + 1}\n` + d.activities.map((a: Activity) => `  - ${a.time || '--:--'} ${a.title}`).join('\n'))
      .join('\n\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `havre-${city.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
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
    if (!plan) return [] as { areaName: string; areaHero: string | null; summary: string; slots: AreaSlot[] }[];
    return plan.days.map((day) => {
      const a = buildAreaDayFromDay(day, city);
      const slotsArr: AreaSlot[] = (Object.entries(a.slots) as [SlotKey, Activity | null][])
        .map(([key, activity]) => ({ key, activity } as unknown as AreaSlot));
      return {
        areaName: a.areaName,
        areaHero: a.coverUrl,
        summary: a.areaSummary,
        slots: slotsArr,
      };
    });
  }, [plan, city]);

  // Swap handler used by AreaDayCard callbacks
  function swapPlace({ mode, dayIdx, slotKey }: { mode: 'similar' | 'any'; dayIdx: number; slotKey: SlotKey }) {
    if (!plan) return
    setPlan((prev) => {
      if (!prev) return prev
      const next: Itinerary = JSON.parse(JSON.stringify(prev))
      const pool: Activity[] = (next.days[dayIdx].activities || []) as Activity[]

      // Determine current activity for the slot
  const currentArea = buildAreaDayFromDay(next.days[dayIdx], city)
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
  destination={city}
  city={city}
  days={days}
  setDays={setDays}
  pace={pace}
  setPace={setPace}
  budget={budget}
  setBudget={setBudget}
  wake={sWake}
  setWake={setSWake}
  plan={plan}
  onApply={() => {
    updateURLWithPrefs();
    persistRequest();
    if (mode === 'areas') generateAreas();
    else generate();
  }}
  interests={interestsLabel}
  actions={{
    onRegenerate: generate,
    regenerating: loading,
    mailHref,
    onCopyLink: copyLink,
    onExport: exportText,
  }}
/>

      <div className="mt-2 flex justify-end">
        <div className="inline-flex items-center gap-2 text-xs text-slate-600">
          <span>Mode:</span>
          <button
            onClick={() => {
              setMode('itinerary')
              const u = new URL(window.location.href)
              u.searchParams.delete('mode')
              window.history.replaceState({}, '', u.toString())
            }}
            className={clsx('rounded px-2 py-1 border', mode === 'itinerary' ? 'bg-sky-600 text-white border-sky-600' : 'hover:bg-slate-50')}
          >
            Itinerary
          </button>
          <button
            onClick={() => {
              setMode('areas')
              const u = new URL(window.location.href)
              u.searchParams.set('mode','areas')
              window.history.replaceState({}, '', u.toString())
            }}
            className={clsx('rounded px-2 py-1 border', mode === 'areas' ? 'bg-sky-600 text-white border-sky-600' : 'hover:bg-slate-50')}
          >
            Areas
          </button>
        </div>
      </div>
      </div>

      {/* main */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        {!plan && !loading && (
          <div className="mb-6 rounded-xl border bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-slate-900">
                  Ready to {mode === 'areas' ? 'suggest areas' : 'plan your days'}?
                </div>
                <div className="text-sm text-slate-600">We’ll generate a day-by-day plan using your preferences.</div>
              </div>
              <button
                onClick={mode === 'areas' ? generateAreas : generate}
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

  {error && (
    <div className="my-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {error}
    </div>
  )}

        {!loading && areaDayGroups.length > 0 && (
          <div className="mt-6 space-y-8">
            {areaDayGroups.map((group, dayIdx) => (
              <div key={dayIdx} className="space-y-6">
                {group.map((day: any, k: number) => (
                  <AreaDayCard
                    key={`${dayIdx}-${k}`}
                    dayIndex={dayIdx}
                    area={{ name: day.area.name, imageUrl: day.area.imageUrl }}
                    summary={day.summary}
                    slots={[
                      { key: 'cafe', label: 'Cafés', place: day.slots.cafes?.[0] || null },
                      { key: 'lunch', label: 'Food & Drink', place: day.slots.food_drink?.[0] || null },
                      { key: 'museum', label: 'Museums', place: day.slots.museums?.[0] || null },
                      { key: 'gallery', label: 'Galleries', place: day.slots.galleries?.[0] || null },
                      { key: 'walk', label: 'Outdoors', place: day.slots.outdoors?.[0] || null },
                      { key: 'bar', label: 'Nightlife', place: day.slots.nightlife?.[0] || null },
                    ]}
                    onSwapSimilar={(dIdx, slotKey) => null}
                    onSwapAny={(dIdx, slotKey) => null}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}