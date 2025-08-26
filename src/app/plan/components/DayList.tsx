'use client'
import React from 'react'
import { Clock, ExternalLink, Footprints } from 'lucide-react'

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

export default function DayList({ days }: { days: DayPlan[] }) {
  if (!days?.length) return null

  return (
    <div className="space-y-8">
      {days.map((day, idx) => (
        <div key={idx} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
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
                <div className="w-16 shrink-0">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{a.time || '--:--'}</span>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-900">{a.title}</div>
                  {a.details ? <div className="mt-1 text-sm text-slate-600">{a.details}</div> : null}

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
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}