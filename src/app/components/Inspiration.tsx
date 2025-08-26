export default function Inspiration() {
  const cards = [
    { title: 'Paris weekend', blurb: 'Art, cafés, and river walks.', q: 'Paris' },
    { title: 'Lisbon escape', blurb: 'Tiles, viewpoints & pastries.', q: 'Lisbon' },
    { title: 'Tokyo food tour', blurb: 'Ramen, sushi and neon nights.', q: 'Tokyo' },
  ]
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">Get inspired</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(c => (
          <a
            key={c.title}
            href={`/plan?d=${encodeURIComponent(c.q)}&autostart=1`}
            className="group block overflow-hidden rounded-xl border bg-white shadow-sm hover:shadow-md"
          >
            <div className="h-36 w-full bg-slate-100 bg-[url('https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center" />
            <div className="p-3">
              <div className="text-sm font-medium text-slate-900 group-hover:text-sky-700">{c.title}</div>
              <div className="mt-0.5 text-xs text-slate-600">{c.blurb}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}