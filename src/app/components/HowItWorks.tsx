export default function HowItWorks() {
  const steps = [
    { n: 1, t: 'Tell us the basics', d: 'Destination, days, vibe and budget.' },
    { n: 2, t: 'We pick the gems', d: 'Restaurants, culture and walks that fit.' },
    { n: 3, t: 'Get a day-by-day plan', d: 'With routes, timing and quick export.' },
  ]
  return (
    <div id="how">
      <h2 className="text-xl font-semibold text-slate-900">How it works</h2>
      <ol className="mt-4 grid gap-4 sm:grid-cols-3">
        {steps.map(s => (
          <li key={s.n} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold text-sky-700">Step {s.n}</div>
            <div className="mt-1 text-sm font-medium text-slate-900">{s.t}</div>
            <div className="mt-1 text-sm text-slate-600">{s.d}</div>
          </li>
        ))}
      </ol>
    </div>
  )
}