'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Plane, MapPin, CalendarDays, Sparkles, Landmark, Utensils, Wine, SlidersHorizontal, Footprints, Download, Coffee, Music, Palette, Leaf, Sun, Moon, Clock } from 'lucide-react'

// Landing page with original-style header: full-bleed slideshow,
// central big freeform input, preferences toggle, and sections below.
export default function Page() {
  const images = useMemo(
    () => [
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&amp;auto=format&amp;fit=crop&amp;w=2000&amp;h=1200', // Paris
      'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?q=80&amp;auto=format&amp;fit=crop&amp;w=2000&amp;h=1200', // London
      'https://images.unsplash.com/photo-1464790719320-516ecd75af6c?q=80&amp;auto=format&amp;fit=crop&amp;w=2000&amp;h=1200', // Barcelona
      'https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?q=80&amp;auto=format&amp;fit=crop&amp;w=2000&amp;h=1200', // Rome
    ],
    []
  )

  const [frame, setFrame] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % images.length), 5000)
    return () => clearInterval(id)
  }, [images.length])

  // --- Freeform prompt (single big field)
  const [prompt, setPrompt] = useState(
    '5‑day trip to Paris exploring nightlife, local restaurants, and art events'
  )
  const [showPrefs, setShowPrefs] = useState(false)
  const [budget, setBudget] = useState<'low' | 'mid' | 'high'>('mid')
  const [pace, setPace] = useState<'relaxed' | 'balanced' | 'packed'>('balanced')
  const [hours, setHours] = useState<'short' | 'standard' | 'long'>('standard')

  const [days, setDays] = useState(5)
  const [wake, setWake] = useState<'early' | 'normal' | 'late'>('normal')

  const categories = [
    { key: 'cafes', label: 'Cafés', Icon: Coffee },
    { key: 'bars', label: 'Bars & wine', Icon: Wine },
    { key: 'restaurants', label: 'Restaurants', Icon: Utensils },
    { key: 'museums', label: 'Museums', Icon: Landmark },
    { key: 'art', label: 'Art & design', Icon: Palette },
    { key: 'music', label: 'Live music', Icon: Music },
    { key: 'parks', label: 'Parks', Icon: Leaf },
  ] as const
  const [selectedCats, setSelectedCats] = useState<Record<string, boolean>>({
    cafes: true, bars: true, restaurants: true, museums: true, art: false, music: false, parks: true
  })

  // Very small heuristic to extract destination from prompt; falls back to Paris.
  function extractDestination(text: string): string {
    // look for "... to CITY ..." (keeps letters, spaces and dashes)
    const m = text.match(/to\s+([A-Za-zÀ-ÿ\s-]+)/i)
    if (m && m[1]) {
      return m[1].trim().split(/[\.,;!]/)[0].trim()
    }
    // otherwise try first capitalized word
    const m2 = text.match(/\b([A-Z][A-Za-zÀ-ÿ-]+)\b/)
    return (m2 && m2[1]) ? m2[1] : 'Paris'
  }

  const destination = useMemo(() => extractDestination(prompt), [prompt])

  const planHref = useMemo(() => {
    const params = new URLSearchParams()
    params.set('d', destination)
    params.set('budget', budget)
    params.set('pace', pace)
    params.set('hours', hours)
    params.set('days', String(days))
    params.set('wake', wake)
    const interests = Object.entries(selectedCats).filter(([_, v]) => v).map(([k]) => k).join(',')
    if (interests) params.set('interests', interests)
    params.set('autostart', '1')
    // carry the raw prompt as a hint (ignored by planner if unused)
    params.set('q', prompt)
    return `/plan?${params.toString()}`
  }, [destination, budget, pace, hours, prompt, days, wake, selectedCats])

  return (
    <main className="min-h-screen w-full bg-slate-50">
      {/* Header / Hero */}
      <section className="relative h-[78vh] min-h-[560px] w-full overflow-hidden">
        {/* Cross‑fade slideshow */}
        {images.map((src, i) => (
          <div
            key={i}
            className="absolute inset-0 bg-center bg-cover transition-opacity duration-[1400ms]"
            style={{ backgroundImage: `url(${src})`, opacity: frame === i ? 1 : 0 }}
            aria-hidden
          />
        ))}
        {/* Gradient scrim for legibility */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Centered content */}
        <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-4 text-center text-white">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight drop-shadow md:text-6xl">
            Plan beautiful city breaks—smart, fast, personal
          </h1>
          <p className="mt-4 max-w-2xl text-sky-100">
            Tell us where you want to go and what you want to do. We’ll build a balanced, walkable itinerary with food, culture and local gems.
          </p>

          {/* Big freeform input + CTA */}
          <div className="mt-8 w-full max-w-4xl rounded-2xl bg-white/80 p-6 shadow-xl ring-1 ring-white/40 backdrop-blur-md">
            <div className="flex flex-col items-stretch gap-3 sm:flex-row">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe where you want to go and what you want to do"
                className="h-16 flex-1 rounded-xl border border-slate-200/60 px-5 text-xl text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/70"
              />
              <Link
                href={planHref}
                className="inline-flex h-16 items-center justify-center rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-7 text-base font-semibold text-white shadow-md hover:from-sky-700 hover:to-cyan-600"
              >
                Plan my trip
              </Link>
            </div>

            {/* Preferences toggle */}
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowPrefs((v) => !v)}
                className="text-left text-sm font-medium text-slate-800 hover:text-sky-700 underline-offset-2 hover:underline"
              >
                {showPrefs ? 'Hide preferences' : 'Prefer to insert your preferences?'}
              </button>
              <div className="text-xs text-slate-500">Optional</div>
            </div>

            {showPrefs && (
              <div className="mt-4 grid grid-cols-1 gap-4">
                {/* Interest chips */}
                <div className="text-left">
                  <div className="mb-2 text-sm font-medium text-slate-700">Interests</div>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(({ key, label, Icon }) => {
                      const active = !!selectedCats[key]
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedCats(s => ({ ...s, [key]: !s[key] }))}
                          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm ${active ? 'bg-sky-600 text-white border-sky-600 shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'}`}
                          aria-pressed={active}
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Sliders & selects */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <label className="block text-left text-sm">
                    <div className="mb-1 text-slate-700">Budget</div>
                    <select
                      value={budget}
                      onChange={(e) => setBudget(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="low">Low</option>
                      <option value="mid">Mid</option>
                      <option value="high">High</option>
                    </select>
                  </label>

                  <label className="block text-left text-sm">
                    <div className="mb-1 text-slate-700">Pace</div>
                    <select
                      value={pace}
                      onChange={(e) => setPace(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="relaxed">Relaxed</option>
                      <option value="balanced">Balanced</option>
                      <option value="packed">Packed</option>
                    </select>
                  </label>

                  <label className="block text-left text-sm">
                    <div className="mb-1 text-slate-700">Day length</div>
                    <select
                      value={hours}
                      onChange={(e) => setHours(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="short">Short</option>
                      <option value="standard">Standard</option>
                      <option value="long">Long</option>
                    </select>
                  </label>
                </div>

                {/* Early / late & days */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
                  <div className="text-left">
                    <div className="mb-1 text-sm font-medium text-slate-700">Wake preference</div>
                    <div className="inline-flex rounded-xl border bg-white p-1">
                      <button
                        type="button"
                        onClick={() => setWake('early')}
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${wake === 'early' ? 'bg-sky-600 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        <Sun className="h-4 w-4" /> Early bird
                      </button>
                      <button
                        type="button"
                        onClick={() => setWake('normal')}
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${wake === 'normal' ? 'bg-sky-600 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        <Clock className="h-4 w-4" /> Standard
                      </button>
                      <button
                        type="button"
                        onClick={() => setWake('late')}
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${wake === 'late' ? 'bg-sky-600 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        <Moon className="h-4 w-4" /> Late riser
                      </button>
                    </div>
                  </div>

                  <label className="block text-left sm:col-span-2">
                    <div className="mb-1 text-sm font-medium text-slate-700">Number of days: <span className="font-semibold">{days}</span></div>
                    <input
                      type="range"
                      min={1}
                      max={14}
                      value={days}
                      onChange={(e) => setDays(Number(e.target.value))}
                      className="w-full"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sections below the fold, as before */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <Inspiration />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <HowItWorks />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <ExploreCities />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <FinalCTA />
      </section>

      <Footer />
    </main>
  )
}

// --- Below-the-fold components (same copy/layout as earlier)

function Inspiration() {
  const cards = [
    { icon: <Utensils className="h-5 w-5" />, title: 'Restaurants you’ll love', text: 'Neo‑bistros, natural wine spots, coffee bars, pastry stops.' },
    { icon: <Landmark className="h-5 w-5" />, title: 'Culture & landmarks', text: 'Museums, galleries, gardens and architectural highlights.' },
    { icon: <Wine className="h-5 w-5" />, title: 'Nightlife or low‑key', text: 'From casual apéro to late‑night bars—your call.' },
    { icon: <Sparkles className="h-5 w-5" />, title: 'Hidden gems', text: 'Local neighborhoods and lesser‑known favorites.' },
  ]
  return (
    <div>
      <h2 className="text-3xl font-semibold text-slate-900">What you get</h2>
      <p className="mt-2 max-w-2xl text-slate-600">
        A clean plan for each day—times, descriptions, tags, and a live map with walking lines between stops.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <div key={i} className="rounded-2xl border bg-white p-5 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 text-slate-900">
              <span className="rounded-xl bg-sky-50 p-3 text-sky-700 ring-1 ring-sky-200">{c.icon}</span>
              <div className="font-medium">{c.title}</div>
            </div>
            <div className="mt-2 text-sm text-slate-600">{c.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HowItWorks() {
  const steps = [
    { icon: <MapPin className="h-5 w-5" />, title: 'Tell us your base', text: 'Pick your city and roughly where you’re staying.' },
    { icon: <SlidersHorizontal className="h-5 w-5" />, title: 'Set your style', text: 'Budget, pace, and interests (food, art, nightlife…).' },
    { icon: <Footprints className="h-5 w-5" />, title: 'Get a smart route', text: 'Balanced days with walkable sequences and backup options.' },
    { icon: <Download className="h-5 w-5" />, title: 'Export & share', text: 'Send to friends, save offline, or open in Google Maps.' },
  ]
  return (
    <div id="how">
      <h2 className="text-3xl font-semibold text-slate-900">How it works</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <div key={i} className="rounded-2xl border bg-white p-5 shadow-md">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-slate-100 p-2 text-slate-700">{s.icon}</span>
              <div className="font-medium text-slate-900">{s.title}</div>
            </div>
            <div className="mt-2 text-sm text-slate-600">{s.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ExploreCities() {
  const cities = [
    {
      name: 'Munich',
      img: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&auto=format&fit=crop&w=1400&h=900',
      href: '/plan?d=Munich&days=3&pace=balanced&interests=beer,restaurants,parks&autostart=1&q=Weekend in Munich with beer gardens and museums'
    },
    {
      name: 'Paris',
      img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&auto=format&fit=crop&w=1400&h=900',
      href: '/plan?d=Paris&days=5&pace=balanced&interests=cafes,restaurants,art,museums&autostart=1&q=5-day Paris food and art itinerary'
    },
    {
      name: 'Lebanon',
      img: 'https://images.unsplash.com/photo-1602934445530-55f577c5e4a9?q=80&auto=format&fit=crop&w=1400&h=900',
      href: '/plan?d=Beirut&days=4&pace=relaxed&interests=restaurants,art,parks&autostart=1&q=Relaxed Beirut with coastal food and galleries'
    },
  ]
  return (
    <div>
      <h2 className="text-3xl font-semibold text-slate-900">Inspiration</h2>
      <p className="mt-2 max-w-2xl text-slate-600">Jump straight into a curated plan.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((c) => (
          <Link key={c.name} href={c.href} className="group rounded-2xl border bg-white shadow-md hover:shadow-lg overflow-hidden">
            <div className="relative h-44 w-full overflow-hidden">
              <img src={c.img} alt={c.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 text-white text-lg font-semibold drop-shadow">{c.name}</div>
            </div>
            <div className="p-4 text-sm text-slate-600">Open a prefilled itinerary for {c.name}.</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function FinalCTA() {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-sky-600 to-sky-500 p-6 text-white shadow-sm">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="text-lg font-semibold">Ready to plan?</div>
          <div className="mt-1 text-sky-100">Create a tailored itinerary in under a minute.</div>
        </div>
        <Link
          href="/plan?d=Paris&amp;autostart=1"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-sky-700 hover:bg-slate-50"
        >
          <CalendarDays className="h-4 w-4" />
          Open planner
        </Link>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-600">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>© {new Date().getFullYear()} Havre</div>
          <nav className="flex items-center gap-4">
            <Link href="/plan" className="hover:underline">Plan</Link>
            <Link href="#how" className="hover:underline">How it works</Link>
            <Link href="#" className="hover:underline">Pricing</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}