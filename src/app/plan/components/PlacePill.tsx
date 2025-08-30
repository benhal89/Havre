'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'

type PlaceLite = {
  id?: string
  name: string
  city?: string
  lat?: number
  lng?: number
  google_url?: string | null
  website?: string | null
  price_level?: number | null
  tags?: string[] | null
}

type Props = {
  place?: PlaceLite | null
  fallbackCity?: string
  className?: string
}

type G = {
  placeId: string | null
  photoUrl: string | null
  googleUrl: string | null
  summary: string | null
  website: string | null
}

export default function PlacePill({ place, fallbackCity, className }: Props) {
  const [details, setDetails] = useState<G | null>(null)

  useEffect(() => {
    let alive = true
    async function run() {
      if (!place?.name) { setDetails(null); return }
      const u = new URL('/api/google/place-details', window.location.origin)
      u.searchParams.set('name', place.name)
      if (place.city || fallbackCity) u.searchParams.set('city', String(place.city || fallbackCity))
      if (typeof place.lat === 'number') u.searchParams.set('lat', String(place.lat))
      if (typeof place.lng === 'number') u.searchParams.set('lng', String(place.lng))
      try {
        const r = await fetch(u.toString())
        const j = (await r.json()) as G
        if (alive) setDetails(j)
      } catch {
        if (alive) setDetails(null)
      }
    }
    run()
    return () => { alive = false }
  }, [place?.name, place?.city, place?.lat, place?.lng, fallbackCity])

  if (!place) {
    return (
      <div className={clsx('rounded-xl border bg-white p-3 text-sm text-slate-500', className)}>
        (No suggestion yet)
      </div>
    )
  }

  const googleHref =
    place.google_url ||
    details?.googleUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.city || fallbackCity || ''}`.trim())}`

  const price =
    typeof place.price_level === 'number' && place.price_level > 0
      ? '€'.repeat(Math.min(5, place.price_level))
      : null

  return (
    <a
      href={googleHref}
      target="_blank"
      rel="noreferrer"
      className={clsx(
        'group flex items-center gap-3 rounded-xl border bg-white p-3 hover:shadow-sm transition',
        className,
      )}
    >
      {/* thumb */}
      <div className="h-12 w-12 overflow-hidden rounded-lg bg-slate-100 flex-shrink-0">
        {details?.photoUrl ? (
          <img
            src={details.photoUrl}
            alt={place.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-slate-400 text-xs">photo</div>
        )}
      </div>

      {/* text */}
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-slate-900 group-hover:underline">
          {place.name}
        </div>
        <div className="mt-0.5 text-xs text-slate-500 truncate">
          {[price, (place.tags || []).slice(0, 2).join(' · ')].filter(Boolean).join(' · ')}
        </div>
      </div>
    </a>
  )
}