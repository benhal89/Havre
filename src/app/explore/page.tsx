'use client'

import Link from 'next/link'

const ideas = [
  {
    title: 'Paris for food lovers',
    img: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?q=60&w=1200&auto=format&fit=crop',
    params: { d: 'Paris', i: 'food, natural wine, bistros', dates: '2025-09-10 to 2025-09-14' },
  },
  {
    title: 'Lisbon hidden gems',
    img: 'https://images.unsplash.com/photo-1529651737248-dad5e287768e?q=60&w=1200&auto=format&fit=crop',
    params: { d: 'Lisbon', i: 'hidden gems, viewpoints, seafood' },
  },
  {
    title: 'New York culture & dining',
    img: 'https://images.unsplash.com/photo-1549921296-3ecf9e1b8030?q=60&w=1200&auto=format&fit=crop',
    params: { d: 'New York', i: 'art, museums, modern dining, cocktails' },
  },
  {
    title: 'Tokyo neighborhood hop',
    img: 'https://images.unsplash.com/photo-1505060897404-c4a9276f8386?q=60&w=1200&auto=format&fit=crop',
    params: { d: 'Tokyo', i: 'ramen, izakaya, design, hidden bars' },
  },
  {
    title: 'Barcelona beach & tapas',
    img: 'https://images.unsplash.com/photo-1520943962033-86ad47c8d1a5?q=60&w=1200&auto=format&fit=crop',
    params: { d: 'Barcelona', i: 'tapas, beach time, architecture' },
  },
  {
    title: 'Rome classics in 3 days',
    img: 'https://images.unsplash.com/photo-1506806732259-39c2d0268443?q=60&w=1200&auto=format&fit=crop',
    params: { d: 'Rome', i: 'landmarks, gelato, trattoria', dates: '2025-10-02 to 2025-10-04' },
  },
]

export default function ExplorePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Explore ideas</h1>
      <p className="mt-2 text-slate-600">One click opens the planner pre-filled for you.</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ideas.map((x, i) => {
          const qs = new URLSearchParams()
          if (x.params.d) qs.set('d', x.params.d)
          if (x.params.i) qs.set('i', x.params.i)
          if (x.params.dates) qs.set('dates', x.params.dates)
          qs.set('autostart', '1')

          return (
            <Link key={i} href={`/plan?${qs.toString()}`} className="group overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div
                className="h-40 w-full bg-cover bg-center transition group-hover:scale-105"
                style={{ backgroundImage: `url(${x.img})` }}
              />
              <div className="p-4">
                <div className="text-base font-semibold">{x.title}</div>
                <div className="mt-1 text-sm text-slate-600">{x.params.i}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </main>
  )
}