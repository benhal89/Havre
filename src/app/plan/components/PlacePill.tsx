

'use client'

import React from 'react'
import clsx from 'clsx'
import { ExternalLink, Star } from 'lucide-react'

export type PlacePillProps = {
  /** Display name of the place */
  name: string
  /** Link to Google Maps (preferred) or website */
  googleUrl?: string | null
  /** Small list of tags like ['cafe', 'natural_wine'] */
  tags?: string[] | null
  /** 0–5 rating (e.g., 4.5) */
  rating?: number | null
  /** 1–5 price level */
  priceLevel?: number | null
  /** Optional extra classes */
  className?: string
  /** If true, shrink paddings/margins further */
  compact?: boolean
}

function euros(n?: number | null) {
  if (!n || n <= 0) return ''
  return '€'.repeat(Math.max(1, Math.min(5, Math.round(n))))
}

/**
 * Compact chip-like place display
 * - Left: name + (optional tags)
 * - Right: micro rating + price
 * Entire pill is clickable to Google (if url provided).
 */
export default function PlacePill({
  name,
  googleUrl,
  tags,
  rating,
  priceLevel,
  className,
  compact,
}: PlacePillProps) {
  const inner = (
    <div
      className={clsx(
        'inline-flex max-w-full items-center gap-2 rounded-full border bg-white/90 px-3 py-1 text-xs text-slate-800 shadow-sm ring-1 ring-slate-200',
        compact && 'px-2 py-0.5 text-[11px]',
        className,
      )}
    >
      {/* Left: name + tags */}
      <div className="min-w-0 flex items-center gap-2">
        <span className="truncate font-medium">{name}</span>
        {Array.isArray(tags) && tags.length > 0 && (
          <span className="hidden sm:inline-flex max-w-[12rem] items-center gap-1 truncate text-slate-500">
            <span aria-hidden>•</span>
            <span className="truncate">{tags.join(', ')}</span>
          </span>
        )}
      </div>

      <div className="flex-1"></div>

      {/* Right: rating + price */}
      <div className="flex items-center gap-2 shrink-0">
        {typeof rating === 'number' && rating > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-700">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {rating.toFixed(1)}
          </span>
        )}
        {priceLevel > 0 && (
          <span className="text-[11px] tabular-nums text-slate-700" title={`Price level: ${priceLevel}`}>
            {euros(priceLevel)}
          </span>
        )}
        {googleUrl && (
          <ExternalLink
            className="h-3.5 w-3.5 text-slate-500"
            aria-hidden
          />
        )}
      </div>
    </div>
  )

  if (googleUrl) {
    return (
      <a
        href={googleUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-block max-w-full"
        aria-label={`${name} — open on Google Maps`}
        title="Open on Google Maps"
      >
        {inner}
      </a>
    )
  }

  return inner
}