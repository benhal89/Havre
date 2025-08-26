import Link from 'next/link'

export default function FinalCTA() {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-sky-600 to-sky-700 p-6 text-white">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="text-lg font-semibold">Ready to plan your next trip?</div>
          <div className="text-sm/6 opacity-90">Spin up a smart itinerary in seconds. It’s free while in beta.</div>
        </div>
        <Link
          href="/plan?d=Paris&autostart=1"
          className="rounded-lg bg-white/95 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-white"
        >
          Open planner
        </Link>
      </div>
    </div>
  )
}