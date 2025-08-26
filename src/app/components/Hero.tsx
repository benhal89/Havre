'use client'
import Link from 'next/link'

export default function Hero() {
  return (
    <div className="grid items-center gap-8 py-8 md:grid-cols-2">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
          Plan smarter trips in minutes
        </h1>
        <p className="mt-3 max-w-prose text-slate-600">
          Tell us what you like and Havre builds a day-by-day itinerary with walkable routes, great food stops, and must-see highlights.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/plan?d=Paris&autostart=1"
            className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Start planning
          </Link>
          <a
            href="#how"
            className="inline-flex items-center rounded-lg border px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            How it works
          </a>
        </div>
      </div>

      {/* simple hero image */}
      <div
        className="h-56 w-full overflow-hidden rounded-2xl border bg-[url('https://images.unsplash.com/photo-1543349689-9a4d426bee8d?q=80&w=1600&auto=format&fit=crop')] bg-cover bg-center shadow-sm md:h-72"
        aria-label="Paris skyline image"
      />
    </div>
  )
}