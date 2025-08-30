'use client'

import { Shuffle, Sparkles, MapPin } from 'lucide-react'
import clsx from 'clsx'
import PlacePill from './PlacePill'

export type AreaSlotKey =
  | 'cafe'
  | 'lunch'
  | 'walk'
  | 'gallery'
  | 'museum'
  | 'bar'
  | 'dinner'
  | 'attraction'

export type AreaSlot = {
  key: AreaSlotKey
  label: string
  place: {
    id: string
    name: string
    description?: string | null
    city: string
    lat?: number | null
    lng?: number | null
    types?: string[] | null
    themes?: string[] | null
    google_url?: string | null
  } | null
}

export default function AreaDayCard({
  dayIndex,
  area,
  summary,
  slots,
  onSwapSimilar,
  onSwapAny,
}: {
  dayIndex: number
  area: { name: string; imageUrl?: string | null; mapUrl?: string | null }
  summary?: string
  slots: AreaSlot[]
  onSwapSimilar?: (dayIdx: number, slotKey: AreaSlotKey) => void
  onSwapAny?: (dayIdx: number, slotKey: AreaSlotKey) => void
}) {
  return (
    <section className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      {/* Header with background */}
      <div
        className={clsx(
          'relative h-40 w-full',
          !area.imageUrl && 'bg-gradient-to-b from-slate-200 to-slate-300',
        )}
      >
        {area.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={area.imageUrl}
            alt={area.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />

        <div className="relative z-10 flex h-full items-end justify-between px-5 pb-3">
          <div>
            <div className="text-white font-semibold">Day {dayIndex + 1}: {area.name}</div>
            {summary && <div className="text-white/85 text-sm">{summary}</div>}
          </div>

          {/* Optional small static map thumbnail */}
          {area.mapUrl && (
            <a
              href={area.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:block overflow-hidden rounded-lg border border-white/50"
              title="Open area in Google Maps"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={area.mapUrl} alt={`${area.name} map`} className="h-20 w-28 object-cover" />
            </a>
          )}
        </div>
      </div>

      {/* Slots */}
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {slots.map((s) => (
            <div key={s.key} className="rounded-xl border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-600">{s.label}</div>
                <div className="flex flex-col gap-1">
                  <button
                    className="inline-flex items-center justify-center rounded-full border px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50"
                    onClick={() => onSwapSimilar?.(dayIndex, s.key)}
                    title="Swap with a similar place"
                  >
                    <Shuffle className="h-3.5 w-3.5" />
                    <span className="ml-1">Similar</span>
                  </button>
                  <button
                    className="inline-flex items-center justify-center rounded-full border px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50"
                    onClick={() => onSwapAny?.(dayIndex, s.key)}
                    title="Swap with anything"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span className="ml-1">Anything</span>
                  </button>
                </div>
              </div>

              {s.place ? (
                <PlacePill
                  place={{
                    ...s.place,
                    lat: s.place.lat ?? undefined,
                    lng: s.place.lng ?? undefined,
                    google_url: s.place.google_url ?? undefined,
                  }}
                />
              ) : (
                <div className="grid grid-cols-[72px_1fr] gap-3 rounded-xl border border-dashed border-slate-300 p-3 text-slate-500">
                  <div className="flex h-[72px] w-[72px] items-center justify-center rounded-lg bg-slate-50">
                  </div>
                  <div className="self-center text-sm">Not selected yet</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}