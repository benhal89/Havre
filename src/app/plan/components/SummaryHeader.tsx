'use client'
import { MapPin } from 'lucide-react'

type Props = {
  destination: string
  days?: number
  budget: string         // "1".."5" (or already like "€€")
  pace: string           // "chill" | "balanced" | "packed"
  hours: string          // "early" | "balanced" | "late"
  homeName?: string
  photoUrl?: string      // optional hero photo URL
}

function labelHours(h: string) {
  if (h === 'early') return 'early‑bird'
  if (h === 'late') return 'late‑riser'
  return 'balanced'
}
function labelPace(p: string) {
  if (p === 'chill') return 'chilled'
  if (p === 'packed') return 'packed'
  return 'balanced'
}
function budgetLabel(b: string) {
  // accept either 1..5 or already formatted "€…"
  if (/^€/.test(b)) return b
  const n = Math.min(Math.max(Number(b) || 3, 1), 5)
  return ['€','€€','€€€','€€€€','€€€€€'][n-1]
}

export default function SummaryHeader({
  destination, days, budget, pace, hours, homeName, photoUrl,
}: Props) {
  const tripTitle = days
    ? `${days}-day trip in ${destination}`
    : `Planning for ${destination}`

  const summary = `This plan fits your ${labelHours(hours)} preferences, a ${labelPace(pace)} pace, and a ${budgetLabel(budget)} budget.`

  return (
    <div className="overflow-hidden rounded-2xl border shadow-sm">
      {/* Hero image */}
      <div
        className="h-44 w-full bg-cover bg-center"
        style={{ backgroundImage: `url("${photoUrl || `https://source.unsplash.com/1200x600/?${encodeURIComponent(destination)},city`}")` }}
      />
      {/* Text row */}
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="text-sm text-slate-500">Havre / Planner</div>
          <div className="mt-0.5 truncate text-xl font-semibold text-slate-900">{tripTitle}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-700">
            {homeName && (
              <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5">
                <MapPin className="h-3.5 w-3.5" /> {homeName}
              </span>
            )}
            <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5">{summary}</span>
          </div>
        </div>
      </div>
    </div>
  )
}