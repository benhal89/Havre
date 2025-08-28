import { Clock, ExternalLink } from 'lucide-react'
import type { Activity } from './types'

export default function DayCard({ day, index }: { day: { activities: Activity[] }, index: number }) {
  return (
    <div className="border rounded-2xl bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b bg-slate-50">
        <div className="text-sm font-semibold">Day {index + 1}</div>
      </div>
      <div>
        {day.activities.map((a, j) => (
          <div key={j} className="flex gap-4 px-4 py-4 border-b last:border-0">
            <div className="w-16 text-xs text-slate-500 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {a.time || '--:--'}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{a.title}</div>
              {a.details && <div className="text-sm text-slate-600">{a.details}</div>}
            </div>
            {a.mapUrl && (
              <a href={a.mapUrl} target="_blank" rel="noreferrer" className="text-xs border px-2 py-1 rounded hover:bg-slate-50 flex items-center gap-1">
                <ExternalLink className="h-3.5 w-3.5" /> Map
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}