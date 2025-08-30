// src/app/plan/components/AreaDayCard.tsx
import React from 'react'
import { Shuffle, MapPin, Image as ImageIcon } from 'lucide-react'
import { getAreaMeta } from '@/lib/areas'

export type AreaSlotKey =
  | 'cafe'
  | 'gallery'
  | 'lunch'
  | 'walk'
  | 'bar'
  | 'dinner'
  | 'museum'

export type SlotActivity = {
  title?: string
  description?: string
  photoUrl?: string | null
  lat?: number
  lng?: number
  mapUrl?: string
}

export type AreaSlot = {
  key: AreaSlotKey
  activity: SlotActivity | null
}

export default function AreaDayCard({
  dayIndex,
  city,
  area,
  summary,
  slots,
  onSwapSimilar,
  onSwapAny,
}: {
  dayIndex: number
  city: string
  area: { name: string; imageUrl?: string }
  summary: string
  slots: AreaSlot[]
  onSwapSimilar: (dayIdx: number, slotKey: AreaSlotKey) => void
  onSwapAny: (dayIdx: number, slotKey: AreaSlotKey) => void
}) {
  const meta = getAreaMeta(city, area.name)
  const cover = area.imageUrl || meta.cover
  const vibe = meta.description || summary
  const sights = meta.sights

  return (
    <section className="rounded-2xl border bg-white overflow-hidden shadow-sm">
      {/* Header with neighborhood cover */}
      <div className="relative h-40 sm:h-48 md:h-56">
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url(${cover})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 sm:p-5">
          <div>
            <div className="text-white text-base font-semibold drop-shadow">
              Day {dayIndex + 1}: {area.name}
            </div>
            <p className="text-white/90 text-sm drop-shadow max-w-3xl">
              {vibe}
              {sights?.length ? (
                <span className="ml-1 opacity-90">
                  • Top sights: {sights.slice(0, 3).join(', ')}
                </span>
              ) : null}
            </p>
          </div>
        </div>
      </div>

      {/* Category slots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {slots.map((slot) => (
          <PlaceBlock
            key={slot.key}
            label={labelFor(slot.key)}
            activity={slot.activity}
            onSwapSimilar={() => onSwapSimilar(dayIndex, slot.key)}
            onSwapAny={() => onSwapAny(dayIndex, slot.key)}
          />
        ))}
      </div>
    </section>
  )
}

function labelFor(k: AreaSlotKey) {
  const map: Record<AreaSlotKey, string> = {
    cafe: 'Café',
    gallery: 'Gallery',
    lunch: 'Lunch',
    walk: 'Walk / Sight',
    bar: 'Bar',
    dinner: 'Dinner',
    museum: 'Museum',
  }
  return map[k] || k
}

function PlaceBlock({
  label,
  activity,
  onSwapSimilar,
  onSwapAny,
}: {
  label: string
  activity: SlotActivity | null
  onSwapSimilar: () => void
  onSwapAny: () => void
}) {
  return (
    <div className="rounded-xl border p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        <div className="flex gap-1">
          <button
            onClick={onSwapSimilar}
            className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-slate-50"
            title="Swap with similar"
          >
            <Shuffle className="h-3.5 w-3.5" /> Similar
          </button>
          <button
            onClick={onSwapAny}
            className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-slate-50"
            title="Swap with anything"
          >
            <Shuffle className="h-3.5 w-3.5" /> Anything
          </button>
        </div>
      </div>

      {activity ? (
        <div className="flex gap-3">
          <div className="h-16 w-20 flex-none overflow-hidden rounded bg-slate-100 flex items-center justify-center">
            {activity.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activity.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-5 w-5 text-slate-400" />
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-slate-900">
              {activity.title || 'Untitled'}
            </div>
            {activity.description && (
              <div className="line-clamp-2 text-sm text-slate-600">
                {activity.description}
              </div>
            )}
            {activity.lat && activity.lng ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  activity.title || '',
                )}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs text-sky-700 hover:underline"
              >
                <MapPin className="h-3.5 w-3.5" /> View on Google Maps
              </a>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center rounded bg-slate-50 text-sm text-slate-500">
          Not selected yet
        </div>
      )}
    </div>
  )
}