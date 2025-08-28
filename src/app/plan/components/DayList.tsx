'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Clock, MapPin, GripVertical } from 'lucide-react'

export type Activity = {
  time?: string
  title: string
  placeId?: string
  lat?: number
  lng?: number
  notes?: string
}

export type DayPlan = { date?: string; activities: Activity[] }

type GDetails = {
  placeId: string | null
  photoUrl: string | null
  googleUrl: string | null
  summary: string | null
  website: string | null
  address?: string | null
}

/* ---------- Small Google details snippet (used for 1–2 sentence blurb) ---------- */
function PlaceSnippet({
  name,
  city,
  lat,
  lng,
}: {
  name: string
  city?: string
  lat?: number
  lng?: number
}) {
  const [d, setD] = useState<GDetails | null>(null)

  useEffect(() => {
    let on = true
    const u = new URL('/api/google/place-details', window.location.origin)
    u.searchParams.set('name', name)
    if (city) u.searchParams.set('city', city)
    if (typeof lat === 'number') u.searchParams.set('lat', String(lat))
    if (typeof lng === 'number') u.searchParams.set('lng', String(lng))
    fetch(u.toString())
      .then(r => r.json())
      .then((j: GDetails) => { if (on) setD(j) })
      .catch(() => { if (on) setD(null) })
    return () => { on = false }
  }, [name, city, lat, lng])

  const href =
    d?.googleUrl ||
    (city
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + city)}`
      : undefined)

  return (
    <>
      {d?.photoUrl && (
        <img
          src={d.photoUrl}
          alt={name}
          className="h-28 w-40 rounded-lg object-cover border border-slate-200"
          loading="lazy"
        />
      )}
      <div className="min-w-0">
        <div className="font-medium text-slate-900">
          {href ? (
            <a href={href} target="_blank" rel="noreferrer" className="hover:underline">
              {name}
            </a>
          ) : (
            name
          )}
        </div>
        <p className="mt-1 text-sm text-slate-600 line-clamp-2">
          {d?.summary || 'Popular spot—tap for more.'}
        </p>
      </div>
    </>
  )
}

/* ================================== PUBLIC API ================================== */

export default function DayList({ days }: { days: DayPlan[] }) {
  if (!Array.isArray(days) || days.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
        No activities yet. Try changing your preferences (city, interests) and regenerate.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {days.map((day, i) => (
        <DayCard key={i} index={i + 1} initialActivities={day.activities || []} />
      ))}
    </div>
  )
}

/* ============================== DAY CARD (DRAGGABLE) ============================= */

function DayCard({
  index,
  initialActivities,
}: {
  index: number
  initialActivities: Activity[]
}) {
  const [open, setOpen] = useState(true)
  const [acts, setActs] = useState<Activity[]>(initialActivities)

  // keep in sync if parent regenerates
  useEffect(() => setActs(initialActivities), [initialActivities])

  // dnd refs
  const dragFrom = useRef<number | null>(null)
  const dragOver = useRef<number | null>(null)

  function onDragStart(idx: number) {
    dragFrom.current = idx
  }
  function onDragEnter(idx: number) {
    dragOver.current = idx
  }
  function onDragEnd() {
    const from = dragFrom.current
    const to = dragOver.current
    dragFrom.current = dragOver.current = null
    if (from === null || to === null || from === to) return
    setActs((prev) => {
      const next = prev.slice()
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="text-base font-semibold text-slate-900">Day {index}</div>
        <div className="text-xs text-slate-600">{acts.length > 0 ? `${acts.length} stops` : 'No stops yet'}</div>
      </button>

      {open && (
        <div className="divide-y divide-slate-100">
          {acts.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-600">
              We didn’t find enough high-scoring places for this day. Try adding more interests or loosening the spending style.
            </div>
          ) : (
            acts.map((a, idx) => (
              <div
                key={`${a.title}-${idx}`}
                className="group flex items-start gap-3 px-3 py-3"
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragEnter={() => onDragEnter(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDragEnd={onDragEnd}
              >
                {/* drag handle */}
                <div
                  className="mt-1.5 cursor-grab text-slate-400 group-hover:text-slate-600"
                  title="Drag to reorder"
                >
                  <GripVertical className="h-5 w-5" />
                </div>

                {/* time */}
                <div className="mt-0.5 shrink-0 w-14 text-xs font-medium text-slate-500">
                  {a.time || ''}
                </div>

                {/* content (title + details) */}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-900">
                    {a.title}
                  </div>

                  {(a.notes || (typeof a.lat === 'number' && typeof a.lng === 'number')) && (
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-600">
                      {a.notes && <span className="truncate">{a.notes}</span>}
                      {typeof a.lat === 'number' && typeof a.lng === 'number' && (
                        <a
                          className="inline-flex items-center gap-1 text-sky-700 hover:underline"
                          href={`https://www.google.com/maps?q=${a.lat},${a.lng}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          Map
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}