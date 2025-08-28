// src/app/plan/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { RefreshCw, Mail, Share2, Download, MapPin } from 'lucide-react'


// local split components
import SummaryHeader from './components/SummaryHeader'
import DayList from './components/DayList'
import ItineraryMap from './components/ItineraryMap'
import Spinner from './components/Spinner'

// ==== [ADD BELOW IMPORTS] ============================================
const CITY_HERO: Record<string, string> = {
  paris:
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=2000&q=80',
  london:
    'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=2000&q=80',
  rome:
    'https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?auto=format&fit=crop&w=2000&q=80',
  barcelona:
    'https://images.unsplash.com/photo-1464790719320-516ecd75af6c?auto=format&fit=crop&w=2000&q=80',
};

function cityHeroFor(city?: string) {
  const key = (city || '').toLowerCase().trim();
  return CITY_HERO[key] || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=80';
}

function googleSearchUrl(name: string, city?: string) {
  const q = encodeURIComponent(`${name} ${city || ''}`.trim());
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
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
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let alive = true
    async function run() {
      setLoading(true)
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
      } finally {
        if (alive) setLoading(false)
      }
    }
    run()
    return () => {
      alive = false
    }
  }, [stop.name, stop.city, stop.lat, stop.lng])

  return { data, loading }
}

// If a place has lat/lng we can draw a Static Maps thumbnail
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

// Build a Static Map for an entire day with multiple markers
function staticMapForDay(stops: { lat?: number; lng?: number }[]) {
  const key =
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ||
    ''
  if (!key || stops.length === 0) return null;
  const base = 'https://maps.googleapis.com/maps/api/staticmap';
  const params = new URLSearchParams({
    scale: '2',
    size: '1200x280',
    maptype: 'roadmap',
    key,
  });
  // up to ~20 markers is fine for Static Maps
  const markers = stops
    .filter(s => !!s.lat && !!s.lng)
    .slice(0, 20)
    .map((s, i) => `color:blue|label:${String.fromCharCode(65 + (i % 26))}|${s.lat},${s.lng}`);
  markers.forEach(m => params.append('markers', m));
  return `${base}?${params.toString()}`;
}

// Small UI chips used in the header for choices
function ChoiceChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/12 text-white px-3 py-1 text-sm backdrop-blur-sm">
      {icon}
      <span className="font-medium drop-shadow-sm">{label}</span>
    </span>
  );
}
// ---- Enriched stop card pulling Google details (photo/link) ----
function StopCard({ activity, city }: { activity: Activity; city: string }) {
  const name = activity.place?.name || activity.title
  const lat = activity.place?.lat
  const lng = activity.place?.lng

  const { data } = useGoogleDetails({ name, city, lat, lng })

  const googleUrl = data?.googleUrl || googleSearchUrl(name, city)
  const photoUrl =
    data?.photoUrl ||
    (lat && lng ? staticMapThumb(lat, lng) :
      // last‑resort city image placeholder
      `https://source.unsplash.com/640x360/?${encodeURIComponent(city + ' city')}`)

  return (
    <div className="flex gap-4 rounded-xl border bg-white p-3 hover:shadow-sm">
      {photoUrl ? (
        <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="block shrink-0">
          <img
            src={photoUrl}
            alt={name}
            className="h-28 w-40 rounded-lg object-cover"
          />
        </a>
      ) : (
        <div className="h-28 w-40 shrink-0 rounded-lg bg-slate-100" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{activity.time || "--:--"}</span>
          {activity.place?.address && (
            <span className="truncate">• {activity.place.address}</span>
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
        {activity.description && (
          <div className="mt-1 line-clamp-2 text-sm text-slate-600">
            {activity.description}
          </div>
        )}
      </div>
    </div>
  )}
// ====================================================================

// shared types

export type Activity = {
  time?: string
  title: string
  description?: string
  tags?: string[]
  place?: { name: string; lat: number; lng: number; address?: string }
}

export type DayPlan = {
  date?: string
  activities: Activity[]
}

export type Itinerary = {
  days: DayPlan[]
}

export default function PlanPage() {
  // ---- read URL params (keep it simple for now)
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const destination = params.get('d') || 'Paris'
  const autostart = params.get('autostart') === '1'
  const hours = params.get('hours') || 'balanced'
  const pace = params.get('pace') || 'balanced'
  const budget = params.get('budget') || '3'
  const homeName = params.get('home_name') || ''

  // ---- state
  const [plan, setPlan] = useState<Itinerary | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (autostart && !plan && !loading) void generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autostart])

  async function generate() {
    // Read URL params once at the top of the component (you likely have this already):
// const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')

const interestsParam = params.get('interests') || '' // "cafes,museums" or ""
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
  // keep whatever you already send:
  budget: params.get('budget') || '3',
  pace: params.get('pace') || 'balanced',
  days: Number(params.get('days') || '3'),
  wake: params.get('wake') || 'standard',
  interests: interestsArr, // <-- now an array, not a string
  // optional: include raw prompt if you have it
  prompt: params.get('q') || ''
}),
      })
      const ctype = res.headers.get('content-type') || ''
      if (!ctype.includes('application/json')) {
        const text = await res.text()
        throw new Error(`API returned non-JSON (${res.status}). ${text.slice(0,120)}`)
      }
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || `Itinerary failed (${res.status})`)
      if (!j?.days || !Array.isArray(j.days)) throw new Error('No days in response.')
      setPlan(j as Itinerary)
    } catch (e: any) {
      setErr(e?.message || 'Failed to generate itinerary.')
    } finally {
      setLoading(false)
    }
  }

  // small helpers for mail/export/copy
  const mailHref = useMemo(() => {
    const subject = encodeURIComponent(`Havre plan: ${destination}`)
    const body = encodeURIComponent(
      plan
        ? plan.days.map((d: DayPlan, i: number) =>
            `Day ${i + 1}\n` +
            d.activities.map((a: Activity) => `  - ${a.time || '--:--'} ${a.title}`).join('\n')
          ).join('\n\n')
        : 'No plan yet.'
    )
    return `mailto:?subject=${subject}&body=${body}`
  }, [plan, destination])

  function copyLink() {
    if (typeof window !== 'undefined') navigator.clipboard?.writeText(window.location.href)
  }

  function exportText() {
    if (!plan) return
    const text = plan.days
      .map((d: DayPlan, i: number) =>
        `Day ${i + 1}\n` +
        d.activities.map((a: Activity) => `  - ${a.time || '--:--'} ${a.title}`).join('\n')
      )
      .join('\n\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `havre-${destination.toLowerCase().replace(/\s+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="min-h-screen bg-white">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places`}
        strategy="afterInteractive"
      />
      {/* top header (summary chips kept inside SummaryHeader) */}
      <div className="border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm text-slate-500">
              <Link href="/" className="text-sky-700 hover:underline">Havre</Link> / Planner
            </div>
            <div className="truncate text-lg font-semibold text-slate-900">
              Planning for {destination}
            </div>
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
            <button onClick={generate} disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
              <RefreshCw className="h-4 w-4" /> {loading ? 'Planning…' : 'Regenerate'}
            </button>
            <a href={mailHref}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
              <Mail className="h-4 w-4" /> Email
            </a>
            <button onClick={copyLink}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
              <Share2 className="h-4 w-4" /> Copy link
            </button>
            <button onClick={exportText} disabled={!plan}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50">
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        </div>
      </div>

      {/* main content */}
      <div className="mx-auto max-w-6xl px-4 py-6 grid gap-6 lg:grid-cols-[1fr,380px]">
        <div>
          {!plan && !loading && (
            <div className="mb-6 rounded-xl border bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">Ready to plan?</div>
                  <div className="text-sm text-slate-600">We’ll generate a day-by-day plan using your preferences.</div>
                </div>
                <button onClick={generate} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
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

          {err && (
            <div className="my-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{err}</div>
          )}

          {plan && !loading && (
            <>
              <SummaryHeader
                destination={destination}
                days={plan.days?.length || 0}
                hours={hours}
                pace={pace}
                budget={String(budget)}
              />

              {/* Enriched days with Google data */}
              <div className="mt-6 space-y-10">
                {plan.days.map((day, di) => {
                  const dayStops = (day.activities || []).map(a => a.place || {}).filter(p => typeof p.lat === 'number' && typeof p.lng === 'number')
                  const dayMap = staticMapForDay(dayStops as { lat?: number; lng?: number }[])
                  return (
                    <section key={di} className="rounded-xl border bg-white">
                      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                        <div className="text-base font-semibold text-slate-900">Day {di + 1}</div>
                        {dayMap && (
                          <img src={dayMap} alt={`Day ${di + 1} map`} className="hidden md:block h-28 w-auto rounded-md border" />
                        )}
                      </div>

                      <div className="divide-y">
                        {day.activities.map((a, ai) => (
                          <div key={ai} className="p-3">
                            <StopCard activity={a} city={destination} />
                          </div>
                        ))}
                      </div>
                    </section>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <aside className="sticky top-[76px] self-start">
          <ItineraryMap days={plan?.days || []} />
        </aside>
      </div>
    </div>
  )
}
