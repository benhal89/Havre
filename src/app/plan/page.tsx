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
    setLoading(true)
    setErr(null)
    setPlan(null)
    try {
      const res = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          interests: `budget:${budget}, hours:${hours}, pace:${pace}`,
          home: homeName || undefined,
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
              <DayList days={plan.days} />
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