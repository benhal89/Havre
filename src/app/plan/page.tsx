'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, RefreshCw, Mail, Share2, Download, ExternalLink, Clock, Star, Footprints, LocateFixed,
} from 'lucide-react'

// Simple Spinner component
function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <svg className="animate-spin h-5 w-5 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>
      {label && <span>{label}</span>}
    </div>
  )
}

type Activity = {
  time?: string
  title: string
  details?: string
  mapUrl?: string
  tags?: string[]
  lat?: number
  lng?: number
}

type DayPlan = {
  date?: string
  activities: Activity[]
}

type Itinerary = {
  days: DayPlan[]
  notes?: string
}

type NearbyPlace = {
  id: string
  name: string
  lat: number
  lng: number
  tags: string[] | null
  summary: string | null
  url: string | null
  distance_km: number
  is_open: boolean
}

const DEFAULT_INTERESTS = 'food, art, hidden gems'

/* ---------------- helpers ---------------- */

function guessDestination(q: string): string | null {
  if (!q) return null
  const m = q.match(/\b([A-Z][a-zA-Z\-éèêäöüâôî]+)\b/)
  return m ? m[1] : null
}

function buildDatesFromToday(days: number) {
  const start = new Date()
  const end = new Date(start.getTime() + Math.max(0, days - 1) * 86400000)
  const s = start.toISOString().slice(0, 10)
  const e = end.toISOString().slice(0, 10)
  return `${s} to ${e}`
}

function labelHours(h: string) {
  if (h === 'early') return 'Early bird'
  if (h === 'late') return 'Late riser'
  return 'Balanced'
}
function labelPace(p: string) {
  if (p === 'chill') return 'Chill'
  if (p === 'packed') return 'Packed'
  return 'Balanced'
}
function budgetLabel(b: string) {
  const n = Number(b)
  return ['€','€€','€€€','€€€€','€€€€€'][Math.min(Math.max(n,1),5)-1]
}

function toTextExport(ctx: {
  plan: Itinerary | null
  destination: string
  dates: string
  home: string
  hours: string
  pace: string
  interestsParam: string
  budget: string
}) {
  const { plan, destination, dates, home, hours, pace, interestsParam, budget } = ctx
  let out = `Havre plan\nDestination: ${destination}\nDates: ${dates}\n`
  if (home) out += `Home base: ${home}\n`
  out += `Hours: ${labelHours(hours)} · Pace: ${labelPace(pace)} · Budget: ${budgetLabel(budget)}\n`
  out += `Interests: ${interestsParam}\n\n`
  if (!plan) return out + '(no plan yet)\n'
  plan.days.forEach((d, i) => {
    out += `Day ${i + 1}${d.date ? ` (${formatDate(d.date)})` : ''}\n`
    d.activities?.forEach(a => {
      out += `  - ${a.time || '--:--'} ${a.title}${a.details ? ` — ${a.details}` : ''}${a.mapUrl ? ` [Map](${a.mapUrl})` : ''}\n`
    })
    out += '\n'
  })
  if (plan.notes) out += `Notes: ${plan.notes}\n`
  return out
}

function formatDate(str?: string) {
  if (!str) return ''
  try {
    const d = new Date(str)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' })
  } catch {
    return str
  }
}

// Simple wrapper to get current position as a promise
function getLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation not available in this browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.message || 'Location permission denied.')),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 }
    )
  })
}

/* -------------- Combined Map for ALL days -------------- */

function CombinedMap({ days }: { days: DayPlan[] }) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const g = (window as any).google
    if (!g?.maps || !mapRef.current) return

    // Collect points per day (only those with coordinates)
    const perDay = days.map((d) =>
      d.activities
        .filter(a => typeof a.lat === 'number' && typeof a.lng === 'number')
        .map((a, idx) => ({
          pos: { lat: a.lat as number, lng: a.lng as number },
          title: a.title,
          idxInDay: idx + 1,
        }))
    )

    // Init map
    const map = new g.maps.Map(mapRef.current, {
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      center: { lat: 48.8566, lng: 2.3522 },
      zoom: 12,
    })

    const bounds = new g.maps.LatLngBounds()

    // A few distinct colors for polylines by day
    const colors = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#14b8a6', '#e11d48']

    perDay.forEach((pts, dayIdx) => {
      if (pts.length === 0) return

      // Markers for that day
      pts.forEach((p, i) => {
        const marker = new g.maps.Marker({
          position: p.pos,
          map,
          label: { text: `${dayIdx + 1}.${p.idxInDay}`, fontSize: '12px' },
          title: p.title,
          icon: {
            path: g.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: colors[dayIdx % colors.length],
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
        })
        bounds.extend(p.pos)
      })

      // Polyline for that day
      if (pts.length >= 2) {
        new g.maps.Polyline({
          path: pts.map(p => p.pos),
          strokeColor: colors[dayIdx % colors.length],
          strokeOpacity: 1,
          strokeWeight: 3,
          map,
        })
      }
    })

    if (!bounds.isEmpty()) map.fitBounds(bounds, 60)
  }, [days])

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-2 text-sm font-semibold">Itinerary map (all days)</div>
      <div ref={mapRef} className="h-[420px] w-full rounded-xl border" />
      <p className="mt-2 text-xs text-slate-600">
        Markers are labeled as <b>Day.Activity</b> (e.g., 2.3 is the 3rd stop on Day 2). Colors separate days.
      </p>
    </div>
  )
}

/* ---------------- Page ---------------- */

export default function PlanPage() {
  const params = useSearchParams()
  const router = useRouter()

  // ---- Read query params
  const q = params?.get('q') || ''
  const destination = params?.get('d') || guessDestination(q) || 'Paris'
  const dates = params?.get('dates') || buildDatesFromToday(3)
  const interestsParam = params?.get('i') || DEFAULT_INTERESTS
  const budget = params?.get('budget') || '3'
  const home = params?.get('home') || ''
  const hours = params?.get('hours') || 'balanced'
  const pace = params?.get('pace') || 'balanced'
  const autostart = params?.get('autostart') === '1'

  // ---- Plan state
  const [plan, setPlan] = useState<Itinerary | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [seed, setSeed] = useState(0)

  // ---- Nearby / Now mode state
  const [nowOpen, setNowOpen] = useState(false)
  const [nearby, setNearby] = useState<NearbyPlace[] | null>(null)
  const [nearbyErr, setNearbyErr] = useState<string | null>(null)
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [radius, setRadius] = useState(1.2) // km
  const [openOnly, setOpenOnly] = useState(false)

  // Build interests string we send to itinerary API
  const interests = useMemo(() => {
    const extras = [
      `budget:${budget}`,
      home ? `home_base:${home}` : '',
      `hours:${hours}`,
      `pace:${pace}`,
      q ? `freeform:${q}` : '',
      seed ? `seed:${seed}` : '',
    ].filter(Boolean)
    return [interestsParam, ...extras].join(', ')
  }, [interestsParam, budget, home, hours, pace, q, seed])

  // Kick off planning on load if autostart
  useEffect(() => {
    if (autostart && !plan && !loading) {
      void generate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autostart])

  async function generate() {
    setLoading(true)
    setErr(null)
    setPlan(null)

    try {
      const res = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, dates, interests }),
      })

      const isJson = res.headers.get('content-type')?.includes('application/json')
      if (!isJson) {
        const text = await res.text()
        throw new Error(`API returned non-JSON (${res.status}): ${text.slice(0, 200)}`)
      }
      const j = await res.json()

      if (!res.ok) {
        if (res.status === 502 && /429|capacity|rate/i.test(j?.error || '')) {
          throw new Error('The AI is busy right now (capacity). Please try again in a moment.')
        }
        if (res.status === 504) {
          throw new Error('The AI took too long. Try again or simplify the request.')
        }
        throw new Error(j?.error || `Unexpected error (${res.status}).`)
      }

      if (!j?.days || !Array.isArray(j.days)) {
        throw new Error('We couldn’t parse a day-by-day plan. Try adjusting interests or dates.')
      }
      setPlan(j as Itinerary)
    } catch (e: any) {
      setErr(e?.message || 'Failed to generate itinerary.')
    } finally {
      setLoading(false)
    }
  }

  function onRegenerate() {
    setSeed((s) => s + 1)
    void generate()
  }

  function onCopyShare() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (!url) return
    navigator.clipboard?.writeText(url)
  }

  function exportText() {
    if (!plan) return
    const text = toTextExport({ plan, destination, dates, home, hours, pace, interestsParam, budget })
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `havre-${destination.toLowerCase().replace(/\s+/g, '-')}.txt`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent(`Havre plan: ${destination} (${dates})`)
    const body = encodeURIComponent(toTextExport({ plan, destination, dates, home, hours, pace, interestsParam, budget }))
    return `mailto:?subject=${subject}&body=${body}`
  }, [plan, destination, dates, home, hours, pace, interestsParam, budget])

  // ------- Nearby logic
  function deriveTagsFromInterests(i: string) {
    return i
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(s => !!s && !/^(budget|home_base|hours|pace|freeform|seed):/.test(s))
  }

  async function openNow() {
    setNowOpen(true)
    if (nearby) return
    await fetchNearby()
  }

  async function fetchNearby(customRadius?: number) {
    setNearby(null)
    setNearbyErr(null)
    setNearbyLoading(true)
    try {
      const coords = await getLocation()
      const tags = deriveTagsFromInterests(interestsParam).join(',')
      const res = await fetch(
        `/api/nearby?lat=${coords.lat}&lng=${coords.lng}`
        + `&radius_km=${encodeURIComponent(customRadius ?? radius)}`
        + `&limit=12`
        + `&tags=${encodeURIComponent(tags)}`
        + `&open_now=${openOnly ? '1' : '0'}`
      )
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || `Nearby error (${res.status})`)
      setNearby((j.results || []) as NearbyPlace[])
    } catch (e: any) {
      setNearbyErr(e?.message || 'Could not find places near you.')
    } finally {
      setNearbyLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm text-slate-500">
              <Link href="/" className="text-sky-700 hover:underline">Havre</Link> / Planner
            </div>
            <div className="truncate text-lg font-semibold text-slate-900">
              {destination} · {dates}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              {home ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
                  <MapPin className="h-3.5 w-3.5" /> {home}
                </span>
              ) : null}
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">hours: {labelHours(hours)}</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">pace: {labelPace(pace)}</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">budget: {budgetLabel(budget)}</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              onClick={openNow}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
              title="Find great places near me"
            >
              <LocateFixed className="h-4 w-4" /> Near me
            </button>
            <button
              onClick={onRegenerate}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" /> Regenerate
            </button>
            <a
              href={mailtoHref}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              <Mail className="h-4 w-4" /> Email
            </a>
            <button
              onClick={onCopyShare}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              <Share2 className="h-4 w-4" /> Copy link
            </button>
            <button
              onClick={exportText}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Now / Nearby panel (unchanged) */}
      <AnimatePresence>
        {nowOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="border-b bg-slate-50/60"
          >
            <div className="mx-auto max-w-6xl px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <LocateFixed className="h-5 w-5 text-slate-700" />
                  <div className="text-sm font-medium text-slate-900">Nearest cool places</div>
                  <div className="text-xs text-slate-600">({deriveTagsFromInterests(interestsParam).join(' · ') || 'all'})</div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={openOnly}
                      onChange={(e) => { setOpenOnly(e.target.checked); fetchNearby() }}
                    />
                    Open now
                  </label>
                  <label className="text-xs text-slate-600">Radius: {radius.toFixed(1)} km</label>
                  <input
                    type="range"
                    min={0.5}
                    max={5}
                    step={0.1}
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    onMouseUp={() => fetchNearby()}
                    onTouchEnd={() => fetchNearby()}
                  />
                  <button onClick={() => fetchNearby()} className="rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-white">
                    Refresh
                  </button>
                  <button onClick={() => { setNowOpen(false) }} className="rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-white">
                    Close
                  </button>
                </div>
              </div>

              <div className="mt-3">
                {nearbyLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Spinner label="Finding spots near you…" />
                  </div>
                )}
                {nearbyErr && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    {nearbyErr}
                  </div>
                )}
                {nearby && nearby.length === 0 && !nearbyLoading && (
                  <div className="rounded-lg border bg-white p-3 text-sm text-slate-600">
                    No results in this radius. Increase radius or adjust interests.
                  </div>
                )}
                {nearby && nearby.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {nearby.map((p) => (
                      <div key={p.id} className="overflow-hidden rounded-xl border bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                              {p.is_open && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  Open now
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-600">{p.distance_km.toFixed(2)} km away</div>
                          </div>
                          <a
                            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name} ${p.lat},${p.lng}`)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Map
                          </a>
                        </div>
                        {p.summary ? <div className="mt-2 line-clamp-3 text-sm text-slate-700">{p.summary}</div> : null}
                        {p.tags && p.tags.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {p.tags.slice(0, 6).map((t, i) => (
                              <span key={i} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700">
                                {t}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* --- NEW: Combined itinerary map card (all days) --- */}
        {plan?.days?.length ? (
          <div className="mb-6">
            <CombinedMap days={plan.days} />
          </div>
        ) : null}

        {!autostart && !plan && !loading && (
          <div className="mb-6 rounded-xl border bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-slate-900">Ready to plan?</div>
                <div className="text-sm text-slate-600">
                  We’ll generate a day-by-day plan using your preferences.
                </div>
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
          <div className="flex items-center justify-center py-20">
            <Spinner label="Planning your days…" />
          </div>
        )}

        {err && (
          <div className="my-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {err}
          </div>
        )}

        {plan && !loading && (
          <div className="space-y-8">
            <AnimatePresence initial={false}>
              {plan.days.map((day, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between border-b bg-slate-50/60 px-4 py-3">
                    <div className="text-sm font-semibold">
                      Day {idx + 1} {day.date ? `· ${formatDate(day.date)}` : ''}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Footprints className="h-4 w-4" />
                      <span>Balanced walking</span>
                    </div>
                  </div>

                  <div className="divide-y">
                    {day.activities?.map((a, j) => (
                      <div key={j} className="flex items-start gap-4 px-4 py-4">
                        <div className="w-16 shrink-0">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{a.time || '--:--'}</span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-slate-900">{a.title}</div>
                          {a.details ? (
                            <div className="mt-1 text-sm text-slate-600">{a.details}</div>
                          ) : null}
                          {a.tags && a.tags.length ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {a.tags.map((t, k) => (
                                <span
                                  key={k}
                                  className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          {a.mapUrl ? (
                            <a
                              href={a.mapUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Map
                            </a>
                          ) : null}
                          <button
                            onClick={onRegenerate}
                            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Swap
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {plan.notes ? (
              <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-700">
                <div className="mb-1 flex items-center gap-1 font-medium">
                  <Star className="h-4 w-4" /> Tips
                </div>
                {plan.notes}
              </div>
            ) : null}
          </div>
        )}

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-sm">
          <Link href="/" className="text-sky-700 hover:underline">← Back to Home</Link>
          <div className="text-slate-500">
            Want to refine? Change options on the Home page, then regenerate.
          </div>
        </div>
      </div>
    </div>
  )
}