'use client'

import React from 'react'
import {
  MapPin,
  ExternalLink,
  Shuffle,
  Wand2,
  Image as ImageIcon,
} from 'lucide-react'
import clsx from 'clsx'
import PlacePill from './PlacePill'

/** Lightweight place type for a single slot */
export type PlaceLite = {
  id?: string
  name: string
  description?: string
  photoUrl?: string | null
  googleUrl?: string | null
  address?: string | null
  tags?: string[]
  rating?: number
  priceLevel?: number
}

/** One “slot” inside a day (e.g., Café, Gallery, Lunch, Walk, Bar, Dinner) */
export type AreaSlot = {
  key:
    | 'cafe'
    | 'gallery'
    | 'lunch'
    | 'walk'
    | 'bar'
    | 'dinner'
    | 'breakfast'
    | 'activity'
    | string
  label: string
  place?: PlaceLite
}

/** Props for the AreaDayCard */
export type AreaDayCardProps = {
  dayIndex: number
  area: {
    name: string
    imageUrl?: string | null // hero/cover for the area
  }
  /** 1–2 sentence area blurb (vibe/what to expect) */
  summary?: string
  /** Category slots for the day (Café, Gallery, Lunch…) */
  slots: AreaSlot[]
  /** Called when user requests a swap (same-type) */
  onSwapSimilar?: (dayIndex: number, slotKey: AreaSlot['key']) => void
  /** Called when user requests a swap (any-type) */
  onSwapAny?: (dayIndex: number, slotKey: AreaSlot['key']) => void
  /** Optional: className passthrough */
  className?: string
}

export default function AreaDayCard({
  dayIndex,
  area,
  summary,
  slots,
  onSwapSimilar,
  onSwapAny,
  className,
}: AreaDayCardProps) {
  const hero = area.imageUrl || null

  return (
    <section
      className={clsx(
        'overflow-hidden rounded-2xl border bg-white shadow-sm',
        className,
      )}
      aria-labelledby={`day-${dayIndex}-title`}
    >
      {/* Header / Area hero */}
      <div className="relative">
        <div
          className={clsx(
            'h-40 w-full bg-slate-100 md:h-52',
            hero ? 'bg-cover bg-center' : 'grid place-items-center',
          )}
          style={hero ? { backgroundImage: `url(${hero})` } : undefined}
        >
          {!hero && (
            <div className="flex items-center gap-2 text-slate-500">
              <ImageIcon className="h-5 w-5" />
              <span>No area image</span>
            </div>
          )}
        </div>

        {/* Title + summary overlay (bottom) */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent px-4 pb-3 pt-10">
          <div className="flex flex-col items-start gap-1 md:flex-row md:items-end md:justify-between">
            <h3
              id={`day-${dayIndex}-title`}
              className="text-lg font-semibold text-white drop-shadow"
            >
              Day {dayIndex + 1}: {area.name}
            </h3>
            {summary && (
              <p className="max-w-2xl text-sm text-white/90 md:text-right drop-shadow">
                {summary}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Slots grid */}
      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {slots.map((slot) => (
          <SlotCard
            key={slot.key}
            dayIndex={dayIndex}
            slot={slot}
            onSwapSimilar={onSwapSimilar}
            onSwapAny={onSwapAny}
          />
        ))}
      </div>
    </section>
  )
}

/* ----------------------- Slot Card ------------------------ */

function SlotCard({
  dayIndex,
  slot,
  onSwapSimilar,
  onSwapAny,
}: {
  dayIndex: number
  slot: AreaSlot
  onSwapSimilar?: (dayIndex: number, slotKey: AreaSlot['key']) => void
  onSwapAny?: (dayIndex: number, slotKey: AreaSlot['key']) => void
}) {
  const p = slot.place

  return (
    <div className="flex items-stretch gap-3 rounded-xl border p-3">
      {/* Photo */}
      <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-md bg-slate-100">
        {p?.photoUrl ? (
          <img
            src={p.photoUrl}
            alt={p.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-slate-400">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {slot.label}
          </div>

          {/* Swap buttons: “similar” / “anything” stacked */}
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={() => onSwapSimilar?.(dayIndex, slot.key)}
              className="inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs font-medium hover:bg-slate-50"
              title="Swap with similar"
            >
              <Shuffle className="h-3.5 w-3.5" />
              Similar
            </button>
            <button
              type="button"
              onClick={() => onSwapAny?.(dayIndex, slot.key)}
              className="inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs font-medium hover:bg-slate-50"
              title="Swap with anything"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Anything
            </button>
          </div>
        </div>

        {/* Pill with name/tags/rating/price that links to Google */}
        <div className="mt-1">
          {p ? (
            <PlacePill
              name={p.name}
              googleUrl={p.googleUrl || undefined}
              tags={p.tags}
              rating={p.rating}
              priceLevel={p.priceLevel}
            />
          ) : (
            <span className="text-slate-400 text-sm">Not selected yet</span>
          )}
        </div>

        {/* Short blurb (kept compact under the pill) */}
        {p?.description && (
          <div className="mt-1 line-clamp-2 text-xs text-slate-600">
            {p.description}
          </div>
        )}
      </div>
    </div>
  )
}