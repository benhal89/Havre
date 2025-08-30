
'use client'

import React, { useEffect, useState } from 'react'
import clsx from 'clsx'

export type SwapMode = 'similar' | 'any'

export type SwapCandidate = {
  id: string
  name: string
  imageUrl?: string | null
  googleUrl?: string | null
  summary?: string | null
  tags?: string[]
  price_level?: number | null
  types?: string[]
}

export type SwapSheetProps = {
  open: boolean
  onClose: () => void
  dayIndex: number
  slotKey: string
  /** initial mode when the sheet opens */
  mode?: SwapMode
  /** Called when a user picks a candidate */
  onPick: (place: SwapCandidate) => void
  /** Optional: override the fetcher (useful for tests). Should return a list of candidates. */
  fetcher?: (args: { dayIndex: number; slotKey: string; mode: SwapMode }) => Promise<SwapCandidate[]>
}

async function defaultFetchAlternatives({ dayIndex, slotKey, mode }: { dayIndex: number; slotKey: string; mode: SwapMode }) {
  const res = await fetch('/api/plan/alternatives', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dayIndex, slotKey, mode }),
  })
  if (!res.ok) throw new Error(`Alt fetch failed: ${res.status}`)
  const json = await res.json()
  return (json?.candidates || []) as SwapCandidate[]
}

export default function SwapSheet({ open, onClose, dayIndex, slotKey, mode = 'similar', onPick, fetcher }: SwapSheetProps) {
  const [activeMode, setActiveMode] = useState<SwapMode>(mode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<SwapCandidate[]>([])

  useEffect(() => {
    if (!open) return
    let alive = true
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const data = await (fetcher || defaultFetchAlternatives)({ dayIndex, slotKey, mode: activeMode })
        if (alive) setItems(data)
      } catch (e: any) {
        if (alive) setError(e?.message || 'Failed to load alternatives')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [open, dayIndex, slotKey, activeMode, fetcher])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <button
        aria-label="Close"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* sheet */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl border-l flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="text-sm font-semibold">Swap place</div>
          <button onClick={onClose} className="rounded border px-2 py-1 text-xs hover:bg-slate-50">Close</button>
        </div>

        {/* mode toggle */}
        <div className="px-4 py-3 border-b flex gap-2">
          {(['similar', 'any'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setActiveMode(m)}
              className={clsx(
                'rounded-full px-3 py-1 text-sm border',
                activeMode === m ? 'bg-slate-900 text-white border-slate-900' : 'bg-white hover:bg-slate-50'
              )}
            >
              {m === 'similar' ? 'Swap with similar' : 'Swap with anything'}
            </button>
          ))}
        </div>

        {/* content */}
        <div className="flex-1 overflow-auto p-4">
          {loading && (
            <div className="py-10 text-center text-sm text-slate-600">Loading options…</div>
          )}
          {error && (
            <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {items.map((p) => (
              <div key={p.id} className="flex gap-3 rounded-xl border bg-white p-3 hover:shadow-sm">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="h-20 w-28 rounded-lg object-cover" />
                ) : (
                  <div className="h-20 w-28 rounded-lg bg-slate-100" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{p.name}</div>
                  {p.summary && <div className="mt-0.5 line-clamp-2 text-xs text-slate-600">{p.summary}</div>}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(p.tags || []).slice(0, 4).map((t) => (
                      <span key={t} className="rounded-full border px-2 py-0.5 text-[11px] text-slate-600">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end justify-between">
                  {p.googleUrl && (
                    <a
                      href={p.googleUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-sky-700 hover:underline"
                    >
                      View
                    </a>
                  )}
                  <button
                    onClick={() => {
                      onPick(p)
                      onClose()
                    }}
                    className="rounded border px-2 py-1 text-xs hover:bg-slate-50"
                  >
                    Choose
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!loading && !error && items.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-600">No alternatives found for this slot.</div>
          )}
        </div>
      </div>
    </div>
  )
}