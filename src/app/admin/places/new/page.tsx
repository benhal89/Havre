// src/app/plan/page.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, RefreshCw, Mail, Share2, Download, ExternalLink, Clock, Star, Footprints, LocateFixed,
} from 'lucide-react'

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
  date?: string               // ignored for display now
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

/* ---------------- small helpers: distance, summary, transport ---------------- */

function haversineKm(a: {lat:number,lng:number}, b: {lat:number,lng:number}) {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI/180
  const dLng = (b.lng - a.lng) * Math.PI/180
  const la1 = a.lat * Math.PI/180
  const la2 = b.lat * Math.PI/180
  const x = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2
  return 2 * R * Math.asin(Math.sqrt(x))
}

function summarizeDay(acts: Activity[]) {
  const labels = new Set<string>()
  const words: string[] = []
  acts.forEach(a => a.tags?.forEach(t => labels.add(t)))
  const tagStr = Array.from(labels).slice(0,6)

  if (tagStr.some(t => /museum|gallery|art/i.test(t))) words.push('museums & galleries')
  if (tagStr.some(t => /wine|natural wine|wine_bar/i.test(t))) words.push('wine bars')
  if (tagStr.some(t => /restaurant|bistro|food|cafe/i.test(t))) words.push('good food')
  if (tagStr.some(t => /park|garden|outdoor|walk/i.test(t))) words.push('green walks')
  if (tagStr.some(t => /landmark|architecture/i.test(t))) words.push('landmarks')
  if (tagStr.some(t => /nightlife|bar|club/i.test(t))) words.push('nightlife')

  if (words.length === 0) return 'Easy pace with local highlights.'
  if (words.length === 1) return `Chilled day focused on ${words[0]}.`
  if (words.length === 2) return `Balanced day with ${words[0]} and ${words[1]}.`
  return `Full day mixing ${words.slice(0, words.length-1).join(', ')} and ${words.at(-1)}.`
}

function transportAdvice(totalKm: number) {
  if (totalKm < 2) return 'Mostly walk.'
  if (totalKm < 5) return 'Walk + optional bike/scooter.'
  if (totalKm < 9) return 'Mix of metro/bus and walking.'
  return 'Prefer metro/taxi between longer hops.'
}

/* ---------------- Google Map for a day ---------------- */

function DayMap({ activities }: { activities: Activity[] }) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const g = (window as any).google
    if (!g?.maps || !mapRef.current) return

    // pick points that have coordinates
    const pts = activities
      .filter(a => typeof a.lat === 'number' && typeof a.lng === 'number')
      .map(a => ({ pos: { lat: a.lat as number, lng: a.lng as number }, title: a.title }))

    // init map
    const map = new g.maps.Map(mapRef.current, {
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoom: 13,
      center: pts[0]?.pos || { lat: 48.8566, lng: 2.3522 }, // Paris fallback
    })

    const bounds = new g.maps.LatLngBounds()
    const path: any[] = []

    pts.forEach((p, i) => {
      const marker = new g.maps.Marker({
        position: p.pos,
        label: String(i+1),
        map,
        title: p.title,
      })
      bounds.extend(p.pos)
      path.push(p.pos)
    })

    if (!bounds.isEmpty()) map.fitBounds(bounds, 50)

    if (path.length >= 2) {
      new g.maps.Polyline({
        path,
        strokeColor: '#0ea5e9',
        strokeWeight: 3,
        map,
      })
    }
  }, [activities])

  return <div ref={mapRef} className="h-[360px] w-full rounded-xl border" />
}

/* ---------------- Spinner ---------------- */

function Spinner({ label = 'Planning…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-600">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

/* ---------- helpers used in header + map ---------- */
function summarizeTop({
  destination, days, hours, pace, budget, interests,
}: { destination: string; days: number; hours: string; pace: string; budget: string; interests: string }) {
  const dayPart = `${days}-day trip in ${destination}`
  const hoursText = hours === 'early' ? 'early bird' : hours === 'late' ? 'late riser' : 'balanced hours'
  const paceText = pace === 'chill' ? 'chilled pace' : pace === 'packed' ? 'packed pace' : 'balanced pace'
  const budgetLabel = ['Shoestring','Value','Comfort','Premium','Luxury'][Math.min(Math.max(Number(budget),1),5)-1]
  const focus = interests
    .split(',').map(s=>s.trim()).filter(Boolean)
    .filter(s => !/^(budget|home_base|hours|pace|freeform|seed):/.test(s))
    .slice(0,2).join(' and ') || 'local highlights'
  return {
    line1: `${dayPart} that fits your ${hoursText}, ${paceText}, and ${budgetLabel.toLowerCase()} spending preferences.`,
    line2: `It’s focused on ${focus}.`,
  }
}

function CombinedMap({ days }: { days: DayPlan[] }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const g = (window as any).google
    if (!g?.maps || !ref.current) return
    const map = new g.maps.Map(ref.current, {
      mapTypeControl: false, streetViewControl: false, fullscreenControl: false, zoom: 12,
      center: { lat: 48.8566, lng: 2.3522 },
    })
    const bounds = new g.maps.LatLngBounds()
    const colors = ['#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6']
    days.forEach((d, di) => {
      const pts = d.activities
        .filter(a => a.lat!=null && a.lng!=null)
        .map(a => ({ lat: a.lat as number, lng: a.lng as number, title: a.title }))
      pts.forEach((p, pi) => {
        new g.maps.Marker({ position: p, label: `${di+1}.${pi+1}`, title: p.title, map })
        bounds.extend(p)
      })
      if (pts.length>1) new g.maps.Polyline({ path: pts, strokeColor: colors[di%colors.length], strokeWeight: 3, map })
    })
    if (!bounds.isEmpty()) map.fitBounds(bounds, 50)
  }, [days])
  return <div ref={ref} className="h-[360px] w-full rounded-xl border" />
}

function staticThumb(a: Activity) {
  if (a.lat==null || a.lng==null) return null
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  if (!key) return null
  const url = `https://maps.googleapis.com/maps/api/staticmap?center=${a.lat},${a.lng}&zoom=15&size=320x200&markers=${a.lat},${a.lng}&scale=2&key=${key}`
  return url
}

/* ---------------- Page ---------------- */

export default function PlanPage() {
  const params = useSearchParams()
  const router = useRouter()

  // ---- Read query params
  const q = params?.get('q') || ''
  const destination = params?.get('d') || guessDestination(q) || 'Paris'
  const dates = params?.get('dates') || buildDatesFromToday(3) // now ignored in display titles
  const interestsParam = params?.get('i') || DEFAULT_INTERESTS
  const budget = params?.get('budget') || '3'
  const homeName = params?.get('home_name') || ''
  const homeLat  = params?.get('home_lat') ? Number(params.get('home_lat')) : undefined
  const homeLng  = params?.get('home_lng') ? Number(params.get('home_lng')) : undefined
  const hours = params?.get('hours') || 'balanced'
  const pace = params?.get('pace') || 'balanced'
  const autostart = params?.get('autostart') === '1'

  // ---- Plan state
  const [plan, setPlan] = useState<Itinerary | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [seed, setSeed] = useState(0)

  // ---- Nearby / Now mode state (kept from your file)
  const [nowOpen, setNowOpen] = useState(false)
  const [nearby, setNearby] = useState<NearbyPlace[] | null>(null)
  const [nearbyErr, setNearbyErr] = useState<string | null>(null)
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [radius, setRadius] = useState(1.2) // km
  const [openOnly, setOpenOnly] = useState(false)

  // interests string for itinerary API
  const interests = useMemo(() => {
    const extras = [
      `budget:${budget}`,
      homeName && homeLat != null && homeLng != null ? `home_base:${homeName}@${homeLat},${homeLng}` : '',
      `hours:${hours}`,
      `pace:${pace}`,
      q ? `freeform:${q}` : '',
      seed ? `seed:${seed}` : '',
    ].filter(Boolean)
    return [interestsParam, ...extras].join(', ')
  }, [interestsParam, budget, homeName, homeLat, homeLng, hours, pace, q, seed])

  // autostart
  useEffect(() => {
    if (autostart && !plan && !loading) void generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autostart])

  async function generate() {
    setLoading(true)
    setErr(null); setPlan(null)
    try {
      const res = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          dates,               // still passed to API if you need it, but not shown
          interests,
          home: homeName,
          home_lat: homeLat,
          home_lng: homeLng,
        }),
      })
      const isJson = res.headers.get('content-type')?.includes('application/json')
      if (!isJson) throw new Error(`API returned non-JSON (${res.status})`)
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || `Unexpected error (${res.status}).`)
      if (!j?.days || !Array.isArray(j.days)) throw new Error('Could not parse a day-by-day plan.')
      setPlan(j as Itinerary)
    } catch (e:any) {
      setErr(e?.message || 'Failed to generate itinerary.')
    } finally {
      setLoading(false)
    }
  }

  function onRegenerate() {
    setSeed(s => s + 1)
    void generate()
  }

  function onCopyShare() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (url) navigator.clipboard?.writeText(url)
  }

  function exportText() {
    if (!plan) return
    const text = toTextExport({ plan, destination, dates, home: homeName, hours, pace, interestsParam, budget })
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `havre-${destination.toLowerCase().replace(/\s+/g, '-')}.txt`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent(`Havre plan: ${destination}`)
    const body = encodeURIComponent(toTextExport({ plan, destination, dates, home: homeName, hours, pace, interestsParam, budget }))
    return `mailto:?subject=${subject}&body=${body}`
  }, [plan, destination, dates, homeName, hours, pace, interestsParam, budget])

  // Nearby helpers kept (deriveTagsFromInterests, getLocation, fetchNearby...) – unchanged
  // ... keep your existing nearby code below this line ...

  // ---- NEW derived data for the right panel (per-day map & metrics)
  const day0 = plan?.days?.[0]
  const day0Acts = day0?.activities ?? []

  const totalKmDay0 = useMemo(() => {
    const pts = day0Acts.filter(a => a.lat != null && a.lng != null) as Required<Pick<Activity,'lat'|'lng'>>[]
    let sum = 0
    for (let i=1;i<pts.length;i++) {
      sum += haversineKm({lat: pts[i-1].lat, lng: pts[i-1].lng}, {lat: pts[i].lat, lng: pts[i].lng})
    }
    return sum
  }, [day0Acts])

  const summaryDay0 = useMemo(() => summarizeDay(day0Acts), [day0Acts])

  const topSummary = summarizeTop({
    destination,
    days: plan?.days?.length || Number(dates.match(/\d+/)?.[0] || 3),
    hours, pace, budget, interests: interestsParam,
  })

  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Sticky header */}
        <div className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <div className="truncate text-sm text-slate-500"></div>
                <Link href="/" className="text-sky-700 hover:underline">Havre</Link> / Planner
              </div>
              {/* NEW: friendly summary instead of dates */}
              <div className="truncate text-lg font-semibold text-slate-900">
                {topSummary.line1}
              </div>
              <div className="text-sm text-slate-700">{topSummary.line2}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                {homeName ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
                    <MapPin className="h-3.5 w-3.5" /> {homeName}
                  </span>
                ) : null}
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">hours: {labelHours(hours)}</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">pace: {labelPace(pace)}</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">budget: {budgetLabel(budget)}</span>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {/* your existing buttons */}
              <button onClick={() => setNowOpen(true)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50" title="Find great places near me">
                <LocateFixed className="h-4 w-4" /> Near me
              </button>
              <button onClick={onRegenerate} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
                <RefreshCw className="h-4 w-4" /> Regenerate
              </button>
              <a href={mailtoHref} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
                <Mail className="h-4 w-4" /> Email
              </a>
              <button onClick={onCopyShare} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
                <Share2 className="h-4 w-4" /> Copy link
              </button>
              <button onClick={exportText} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
                <Download className="h-4 w-4" /> Export
              </button>
            </div>
          </div>
        </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* NEW: top row with summary (left) and all-days map (right) */}
        {plan?.days?.length ? (
          <div className="mb-6 grid gap-6 lg:grid-cols-[1fr,420px]">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold mb-1">Trip overview</div>
              <p className="text-sm text-slate-700">
                {topSummary.line1} {topSummary.line2}
              </p>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold mb-2">Itinerary map (all days)</div>
              <CombinedMap days={plan.days} />
              <div className="mt-2 text-xs text-slate-500">
                Markers are labeled as <b>Day.Activity</b> (e.g. <b>2.3</b> is the 3rd stop on Day 2).
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 grid-cols-1 md:grid-cols-[1fr,370px]">
          <div>
            {!autostart && !plan && !loading && (
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
                        <div className="text-sm font-semibold">Day {idx + 1}</div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Footprints className="h-4 w-4" />
                          <span>Balanced walking</span>
                        </div>
                      </div>

                      <div className="divide-y">
                        {day.activities?.map((a, j) => (
                          <div key={j} className="flex items-start gap-4 px-4 py-4">
                            {/* NEW: thumbnail (static map) if coords available */}
                            {staticThumb(a) ? (
                              <img
                                src={staticThumb(a)!}
                                alt=""
                                className="hidden sm:block h-[84px] w-[132px] rounded-lg border object-cover"
                              />
                            ) : null}
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
                                  Photos / Map
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
              <div className="text-slate-500">Want to refine? Change options on the Home page, then regenerate.</div>
            </div>
          </div>

          {/* RIGHT PANEL: Map, summary & metrics for Day 1 */}
          <aside className="sticky top-[76px] self-start">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold mb-2">Day 1 overview</div>
              <DayMap activities={day0Acts} />
              <div className="mt-3 text-sm text-slate-700">{summaryDay0}</div>
              <div className="mt-3 rounded-lg border bg-slate-50 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Estimated distance</span>
                  <span className="font-medium">{totalKmDay0.toFixed(1)} km</span>
                </div>
                <div className="mt-1 text-slate-700">{transportAdvice(totalKmDay0)}</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

/* ---------------- helpers you already had ---------------- */

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
  let out = `Havre plan\nDestination: ${destination}\nDays: ${plan?.days?.length ?? '-'}\n`
  if (home) out += `Home base: ${home}\n`
  out += `Hours: ${labelHours(hours)} · Pace: ${labelPace(pace)} · Budget: ${budgetLabel(budget)}\n`
  out += `Interests: ${interestsParam}\n\n`
  if (!plan) return out + '(no plan yet)\n'
  plan.days.forEach((d, i) => {
    out += `Day ${i + 1}\n`
    d.activities?.forEach(a => {
      out += `  - ${a.time || '--:--'} ${a.title}${a.details ? ` — ${a.details}` : ''}${a.mapUrl ? ` [Map](${a.mapUrl})` : ''}\n`
    })
    out += '\n'
  })
  if (plan.notes) out += `Notes: ${plan.notes}\n`
  return out
}

// unchanged getLocation() from your file…
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