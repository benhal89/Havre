'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  MapPin,
  CalendarDays,
  Sparkles,
  Landmark,
  Utensils,
  Wine,
  SlidersHorizontal,
  Footprints,
  Download,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'

/* ---------------------- Small helpers ---------------------- */

function GlassCard({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={clsx(
        'rounded-2xl bg-white/70 shadow-glass backdrop-blur-xs border border-beige/60',
        'p-0 sm:p-0',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* --------------------- Below-the-fold ---------------------- */

function HowItWorks() {
  const steps = [
    { title: 'Pick your city + area.', icon: <MapPin className="h-16 w-16 text-gold" /> },
    { title: 'Choose budget, pace, and interests.', icon: <SlidersHorizontal className="h-16 w-16 text-emerald" /> },
    { title: 'Get a smart route.', icon: <Footprints className="h-16 w-16 text-gold" /> },
    { title: 'Export & share.', icon: <Download className="h-16 w-16 text-emerald" /> },
  ]
  return (
    <section id="how" className="py-20 w-full bg-beige/60">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-serif font-semibold text-midnight mb-2">How it works</h2>
        <p className="mb-8 max-w-2xl text-midnight/80 font-sans text-lg">
          Step-by-step, intuitive planning for your perfect trip.
        </p>
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between md:gap-0">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center md:w-1/4 relative">
              <div className="mb-4">{step.icon}</div>
              <div className="text-xl font-serif font-semibold text-midnight mb-1 text-center">
                {step.title}
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute right-[-32px] top-1/2 -translate-y-1/2">
                  <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
                    <path
                      d="M2 12h28m0 0-6-6m6 6-6 6"
                      stroke="#D4AF37"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ExploreCities() {
  const cities = [
    {
      name: 'Munich',
      img: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&auto=format&fit=crop&w=1400&h=900',
      href: '/plan?d=Munich&days=3&pace=balanced&interests=beer,restaurants,parks&autostart=1&q=Weekend in Munich with beer gardens and museums',
    },
    {
      name: 'Paris',
      img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&auto=format&fit=crop&w=1400&h=900',
      href: '/plan?d=Paris&days=5&pace=balanced&interests=cafes,restaurants,art,museums&autostart=1&q=5-day Paris food and art itinerary',
    },
    {
      name: 'Lebanon',
      img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&h=900',
      href: '/plan?d=Beirut&days=4&pace=relaxed&interests=restaurants,art,parks&autostart=1&q=Relaxed Beirut with coastal food and galleries',
    },
  ]
  return (
    <section className="py-20 w-full bg-midnight/95">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-serif font-semibold text-white mb-6">Inspiration</h2>
        <p className="mb-8 max-w-2xl text-white/80 font-sans">Jump straight into a curated plan.</p>
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {cities.map((c) => (
            <Link
              key={c.name}
              href={c.href}
              className="group relative rounded-2xl overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105"
              style={{ minHeight: 340 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.img}
                alt={c.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight/90 via-midnight/40 to-transparent" />
              <div className="relative z-10 flex flex-col justify-end h-full p-8">
                <div className="text-3xl font-serif font-bold text-white drop-shadow mb-2 group-hover:text-gold transition-colors duration-200">
                  {c.name}
                </div>
                <div className="text-lg font-sans text-white/90 mb-4">Curated plan</div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald px-4 py-2 text-white font-semibold text-sm shadow">
                    Explore <span aria-hidden>→</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function Inspiration() {
  const cards: Array<{
    icon: React.ReactNode
    title: string
    text: string
    accent: 'emerald' | 'gold'
    bg: string
  }> = [
    {
      icon: <Utensils className="h-12 w-12 text-white" />,
      title: 'Restaurants you’ll love',
      text: 'Neo-bistros, natural wine spots, coffee bars, pastry stops.',
      accent: 'emerald',
      bg: "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80')",
    },
    {
      icon: <Landmark className="h-12 w-12 text-white" />,
      title: 'Culture & landmarks',
      text: 'Museums, galleries, gardens and architectural highlights.',
      accent: 'gold',
      bg: "url('https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=800&q=80')",
    },
    {
      icon: <Wine className="h-12 w-12 text-white" />,
      title: 'Nightlife or low-key',
      text: 'From casual apéro to late-night bars—your call.',
      accent: 'emerald',
      bg: "url('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80')",
    },
    {
      icon: <Sparkles className="h-12 w-12 text-white" />,
      title: 'Hidden gems',
      text: 'Local neighborhoods and lesser-known favorites.',
      accent: 'gold',
      bg: "url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80')",
    },
  ]
  return (
    <section className="py-16 w-full [--bg:#F8F6F1] bg-[var(--bg)]">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-semibold text-midnight font-serif mb-2">What you get</h2>
        <p className="mb-8 max-w-2xl text-midnight/80 font-sans text-lg">
          Perfectly curated itineraries to enjoy your trip like a local.
        </p>
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
          {cards.map((c, i) => (
            <div
              key={i}
              className="relative rounded-2xl overflow-hidden shadow transition-shadow hover:shadow-lg border border-beige/60 flex flex-col min-h-[260px]"
              style={{ backgroundImage: `${c.bg}`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-midnight/90 via-midnight/70 to-transparent" />
              <div className="relative z-10 flex flex-col h-full p-7">
                <div className="mb-4">{c.icon}</div>
                <div className="text-2xl font-serif font-bold text-white mb-2 drop-shadow" style={{ textShadow: '0 2px 8px #0006' }}>
                  {c.title}
                </div>
                <div className="text-lg text-white/90 font-sans mb-2" style={{ textShadow: '0 2px 8px #0006' }}>
                  {c.text}
                </div>
                <div className="flex-1" />
                <div className={clsx('h-2 w-2 rounded-full', c.accent === 'emerald' ? 'bg-emerald' : 'bg-gold')} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
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
          href="/plan?d=Paris&autostart=1"
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
            <Link href="/plan" className="hover:underline">
              Plan
            </Link>
            <Link href="#how" className="hover:underline">
              How it works
            </Link>
            <Link href="#" className="hover:underline">
              Pricing
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}

/* ------------------------- Hero ---------------------------- */

function Hero({
  prompt,
  setPrompt,
  showPrefs,
  setShowPrefs,
  budget,
  setBudget,
  pace,
  setPace,
  style,
  setStyle,
  days,
  setDays,
  wake,
  setWake,
  selectedCats,
  setSelectedCats,
  images,
  frame,
  city,
  setCity,
  cityError,
  setCityError,
  planPromptHref,
  planPrefsHref,
  destination,
}: {
  prompt: string
  setPrompt: (v: string) => void
  showPrefs: boolean
  setShowPrefs: (v: boolean) => void
  budget: number
  setBudget: (v: number) => void
  pace: 'relaxed' | 'balanced' | 'packed'
  setPace: (v: 'relaxed' | 'balanced' | 'packed') => void
  style: 'hidden' | 'mixed' | 'iconic'
  setStyle: (v: 'hidden' | 'mixed' | 'iconic') => void
  days: number
  setDays: (v: number) => void
  wake: 'early' | 'standard' | 'late'
  setWake: (v: 'early' | 'standard' | 'late') => void
  selectedCats: Record<string, boolean>
  setSelectedCats: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  images: string[]
  frame: number
  city: string
  setCity: (v: string) => void
  cityError: string
  setCityError: (v: string) => void
  planPromptHref: string
  planPrefsHref: string
  destination: string
}) {
  const DAY_MIN = 2
  const DAY_MAX = 14

  const paceOptions = [
    { key: 'relaxed', label: 'Relaxed', hint: 'Fewer stops' },
    { key: 'balanced', label: 'Balanced', hint: 'Default' },
    { key: 'packed', label: 'Packed', hint: 'Many stops' },
  ] as const

  const travelStyleOptions = [
    { key: 'hidden', label: 'Hidden Gems' },
    { key: 'mixed', label: 'Mixed' },
    { key: 'iconic', label: 'Iconic Sights' },
  ] as const

  const spendingOptions = [
    { value: 1, label: 'Shoestring' },
    { value: 2, label: 'Budget' },
    { value: 3, label: 'Comfort' },
    { value: 4, label: 'Premium' },
    { value: 5, label: 'Luxury' },
  ] as const

  const rhythmOptions = [
    { key: 'early', label: 'Early Bird' },
    { key: 'standard', label: 'Standard' },
    { key: 'late', label: 'Night Owl' },
  ] as const

  const interestsFoodDrink = [
    { key: 'cafes', label: 'Cafés' },
    { key: 'restaurants', label: 'Restaurants' },
    { key: 'bars', label: 'Bars & wine' },
  ]
  const interestsCultureArt = [
    { key: 'museums', label: 'Museums' },
    { key: 'galleries', label: 'Galleries' },
    { key: 'architecture', label: 'Architecture' },
  ]
  const interestsEntertainment = [
    { key: 'live_music', label: 'Live music' },
    { key: 'parties', label: 'Parties' },
    { key: 'nightlife', label: 'Nightlife' },
  ]
  const interestsOutdoors = [
    { key: 'parks', label: 'Parks' },
    { key: 'walks', label: 'Walks' },
    { key: 'sports', label: 'Sports Activities' },
  ]

  return (
    <section className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Background slideshow */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <AnimatePresence initial={false}>
          <motion.div
            key={images[frame]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${images[frame]})` }}
          />
        </AnimatePresence>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />

      {/* Foreground content */}
      <div className="relative z-20 mx-auto flex max-w-4xl flex-col items-center px-4 pb-16 pt-20 text-center md:pt-32 w-full gap-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-2 text-emerald font-serif text-2xl font-bold tracking-wide backdrop-blur mb-2">
          <Sparkles className="h-7 w-7" />
          <span className="font-serif">Havre · AI Travel Concierge</span>
        </div>

        <h1 className="mt-2 max-w-2xl text-5xl md:text-7xl font-serif font-bold leading-tight text-white drop-shadow">
          Plan unforgettable trips in minutes.
        </h1>

        <p
          className="mt-2 max-w-xl text-lg md:text-xl text-white/90 font-sans"
          style={{ fontFamily: 'Tenor Sans, var(--font-sans), sans-serif' }}
        >
          Describe your trip or use a few choices—Havre crafts a day-by-day plan with maps, dining, and hidden gems.
        </p>

        {/* Big prompt + free-text CTA */}
        <GlassCard className="mt-10 w-full max-w-2xl p-0">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-0 sm:gap-4 items-stretch">
            <textarea
              className="h-48 sm:h-56 w-full resize-none rounded-l-2xl rounded-r-2xl sm:rounded-r-none border-0 bg-transparent px-6 py-8 text-2xl font-sans text-white placeholder:text-white/70 outline-none focus:ring-2 focus:ring-emerald"
              placeholder='e.g., "3 days in Rome for art, food, and hidden gems. Prefer a relaxed pace and walkable neighborhoods."'
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={{ fontFamily: 'Tenor Sans, var(--font-sans), sans-serif', boxShadow: 'none', background: 'rgba(0,0,0,0.25)' }}
            />
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <button
                onClick={async () => {
                  try {
                    // fire-and-forget save (don’t block navigation)
                    fetch('/api/requests', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        city: (city || destination).trim(),
                        destination,
                        days,
                        pace,
                        budget,
                        wake,
                        interests: Object.entries(selectedCats)
                          .filter(([, v]) => v)
                          .map(([k]) => k),
                        prompt,
                        source: 'landing',
                      }),
                    }).catch(() => {})
                  } finally {
                    window.location.href = planPromptHref
                  }
                }}
                className="sm:rounded-l-none rounded-b-2xl sm:rounded-b-none sm:rounded-r-2xl rounded-r-2xl bg-emerald text-white font-semibold px-10 py-6 text-xl transition hover:bg-emerald/90 focus:outline-none focus:ring-2 focus:ring-emerald border border-white/40 shadow"
                style={{ fontFamily: 'Tenor Sans, var(--font-sans), sans-serif' }}
              >
                Plan my trip
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Toggle preferences */}
        <div className="mt-4">
          <button
            onClick={() => setShowPrefs(!showPrefs)}
            className={clsx(
              'inline-flex items-center gap-2 rounded-xl px-5 py-3 text-lg font-semibold transition',
              showPrefs ? 'bg-white/90 text-emerald border-2 border-emerald shadow' : 'bg-transparent text-white border-2 border-white/60 hover:bg-white/10',
            )}
            style={{ fontFamily: 'Tenor Sans, var(--font-sans), sans-serif' }}
          >
            <SlidersHorizontal className="h-5 w-5" />
            {showPrefs ? 'Hide sliders & choices' : 'Prefer to insert your preferences?'}
          </button>
        </div>

        {/* Preferences panel */}
        <AnimatePresence initial={false}>
          {showPrefs && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-8 w-full max-w-2xl rounded-2xl border border-beige/60 bg-white/95 p-8 text-left backdrop-blur flex flex-col gap-8"
            >
              {/* City (required) */}
              <div className="mb-6">
                <label htmlFor="city-input" className="block text-sm font-medium text-slate-800">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  id="city-input"
                  type="text"
                  placeholder="Paris"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value)
                    if (cityError) setCityError('')
                  }}
                  className={clsx(
                    'mt-2 w-full rounded-lg border px-3 py-2 text-slate-900 placeholder-slate-400',
                    'focus:outline-none focus:ring-2 focus:ring-emerald focus:border-emerald/40',
                    cityError ? 'border-red-400 focus:ring-red-400' : 'border-slate-300',
                  )}
                  aria-invalid={!!cityError}
                  aria-describedby="city-help city-error"
                  autoComplete="off"
                />
                <div id="city-help" className="mt-1 text-xs text-slate-500">
                  Enter a city name — e.g., <em>Paris</em>, <em>Munich</em>, <em>Beirut</em>.
                </div>
                {cityError && (
                  <div id="city-error" className="mt-2 text-xs text-red-600">
                    {cityError}
                  </div>
                )}
              </div>

              {/* Number of Days */}
              <div>
                <label className="block text-base font-serif font-semibold text-midnight mb-2">
                  Number of days
                </label>
                <input
                  type="range"
                  min={2}
                  max={14}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full accent-emerald"
                />
                <div className="mt-1 text-xs text-slate-600">{days} days</div>
              </div>

              {/* Day Pace */}
              <div>
                <div className="text-sm font-medium">Day Pace</div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {[
                    { key: 'relaxed', label: 'Relaxed', hint: 'Fewer stops' },
                    { key: 'balanced', label: 'Balanced', hint: 'Default' },
                    { key: 'packed', label: 'Packed', hint: 'Many stops' },
                  ].map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => setPace(o.key as any)}
                      className={clsx(
                        'inline-flex flex-col items-start rounded-lg border px-3 py-2 text-sm',
                        pace === o.key
                          ? 'bg-white text-black border-black hover:bg-white hover:text-black hover:border-black shadow-sm'
                          : 'bg-transparent text-slate-900 border-slate-300 hover:bg-slate-50'
                      )}
                      aria-pressed={pace === o.key}
                    >
                      <span className="font-medium">{o.label}</span>
                      <span className="text-xs opacity-80">{o.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Travel Style */}
              <div>
                <div className="text-sm font-medium">Travel Style</div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {(['hidden', 'mixed', 'iconic'] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setStyle(k)}
                      className={clsx(
                        'rounded-lg border px-3 py-2 text-sm',
                        style === k
                          ? 'bg-white text-black border-black hover:bg-white hover:text-black hover:border-black shadow-sm'
                          : 'bg-transparent text-slate-900 border-slate-300 hover:bg-slate-50'
                      )}
                      aria-pressed={style === k}
                    >
                      {k === 'hidden' ? 'Hidden Gems' : k === 'mixed' ? 'Mixed' : 'Iconic Sights'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spending Style */}
              <div>
                <div className="text-sm font-medium">Spending Style</div>
                <div className="mt-2 grid grid-cols-5 gap-2 max-sm:grid-cols-3">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setBudget(v)}
                      className={clsx(
                        'rounded-lg border px-3 py-2 text-sm',
                        budget === v
                          ? 'bg-white text-black border-black hover:bg-white hover:text-black hover:border-black shadow-sm'
                          : 'bg-transparent text-slate-900 border-slate-300 hover:bg-slate-50'
                      )}
                      aria-pressed={budget === v}
                    >
                      {['Shoestring','Budget','Comfort','Premium','Luxury'][v-1]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily Rhythm */}
              <div>
                <div className="text-sm font-medium">Daily Rhythm</div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {(['early', 'standard', 'late'] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setWake(k)}
                      className={clsx(
                        'rounded-lg border px-3 py-2 text-sm',
                        wake === k
                          ? 'bg-white text-black border-black hover:bg-white hover:text-black hover:border-black shadow-sm'
                          : 'bg-transparent text-slate-900 border-slate-300 hover:bg-slate-50'
                      )}
                      aria-pressed={wake === k}
                    >
                      {k === 'early' ? 'Early Bird' : k === 'standard' ? 'Standard' : 'Night Owl'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div>
                <div className="text-sm font-medium">Interests</div>
                <div className="space-y-4 mt-2">
                  {[
                    { title: '🍴 Food & Drink', keys: ['cafes','restaurants','bars'] },
                    { title: '🎨 Culture & Art', keys: ['museums','galleries','architecture'] },
                    { title: '🎶 Entertainment', keys: ['live_music','parties','nightlife'] },
                    { title: '🌳 Outdoors', keys: ['parks','walks','sports'] },
                  ].map((group) => (
                    <div key={group.title}>
                      <div className="text-sm font-semibold">{group.title}</div>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {group.keys.map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setSelectedCats((s) => ({ ...s, [key]: !s[key] }))}
                            className={clsx(
                              'rounded-full border px-3 py-1.5 text-sm',
                              selectedCats[key]
                                ? 'bg-white text-black border-black hover:bg-white hover:text-black hover:border-black shadow-sm'
                                : 'bg-transparent text-slate-900 border-slate-300 hover:bg-slate-50'
                            )}
                          >
                            {key.replaceAll('_',' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit from preferences (ignores prompt) */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    const val = (city ?? '').trim()
                    if (!val) {
                      setCityError('Please enter a city.')
                      return
                    }
                    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ.\-'\s]{2,50}$/.test(val)) {
                      setCityError('Please enter a valid city name.')
                      return
                    }
                    window.location.href = planPrefsHref
                  }}
                  className="w-full rounded-xl bg-white text-black border border-black px-5 py-3 text-base font-semibold hover:bg-white focus:outline-none focus:ring-2 focus:ring-emerald shadow-sm"
                >
                  Plan from preferences
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

/* ---------------- Explore Places (homepage section) -------- */

type Place = {
  id: string
  name: string
  description: string | null
  address: string | null
  city: string
  country: string
  lat: number
  lng: number
  website: string | null
  google_place_id: string | null
  types: string[]
  themes: string[]
  rating?: number | null
  price_level?: number | null
}

function googleLinkFor(p: Pick<Place, 'name' | 'city' | 'lat' | 'lng'>) {
  const hasCoords = typeof p.lat === 'number' && typeof p.lng === 'number'
  return hasCoords
    ? `https://www.google.com/maps?q=${p.lat},${p.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name} ${p.city}`)}`
}

function PlaceCard({ place }: { place: Place }) {
  const [photo, setPhoto] = useState<string | null>(null)
  useEffect(() => {
    let on = true
    const u = new URL('/api/google/place-details', window.location.origin)
    u.searchParams.set('name', place.name)
    u.searchParams.set('city', place.city)
    u.searchParams.set('lat', String(place.lat))
    u.searchParams.set('lng', String(place.lng))
    fetch(u.toString())
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (on) setPhoto(d?.photoUrl || null)
      })
      .catch(() => {
        if (on) setPhoto(null)
      })
    return () => {
      on = false
    }
  }, [place.name, place.city, place.lat, place.lng])

  const href = googleLinkFor(place)

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition"
    >
<div className="aspect-[16/10] w-full bg-slate-100">
  {photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photo} alt={place.name} className="h-full w-full object-cover" loading="lazy" />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=70"
      alt={place.name}
      className="h-full w-full object-cover"
      loading="lazy"
    />
  )}
</div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold text-slate-900">{place.name}</div>
            {place.address && <div className="mt-1 truncate text-sm text-slate-600">{place.address}</div>}
          </div>
          {typeof place.rating === 'number' && (
            <div className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
              {place.rating.toFixed(1)}★
            </div>
          )}
        </div>
        {place.description && <p className="mt-2 line-clamp-2 text-sm text-slate-700">{place.description}</p>}
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {place.types?.slice(0, 3).map((t) => (
            <span key={t} className="rounded-full border border-slate-200 px-2 py-1 text-slate-700">
              {t.replaceAll('_', ' ')}
            </span>
          ))}
          {place.themes?.slice(0, 2).map((t) => (
            <span key={t} className="rounded-full bg-slate-50 px-2 py-1 text-slate-700">
              {t.replaceAll('_', ' ')}
            </span>
          ))}
        </div>
      </div>
    </a>
  )
}

// --- Explore places section (drop-in) ---
function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'rounded-full border px-3 py-1.5 text-sm transition',
        active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
      )}
    >
      {children}
    </button>
  )
}

type UIPlace = {
  id: string
  name: string
  description: string | null
  address: string | null
  city: string
  country: string
  lat: number
  lng: number
  types: string[] | null
  themes: string[] | null
  google_url: string
}

function ExplorePlaces() {
  // UI state
  const [city, setCity] = useState('Paris')
  const [typeSel, setTypeSel] = useState<string | null>(null)
  const [vibeSel, setVibeSel] = useState<string | null>(null)
  const [places, setPlaces] = useState<UIPlace[]>([])
  const [loading, setLoading] = useState(false)
  const [idx, setIdx] = useState(0)

  const typeOptions = ['restaurant','cafe','bar','museum','gallery','park','landmark','wine bar','bakery','club']
  const vibeOptions = ['date night','good for solo','family friendly','nightlife','design','architecture','photo spot','rainy day','sunset']

  async function fetchPlaces(opts?: { city?: string; type?: string | null; vibe?: string | null }) {
    setLoading(true)
    try {
      const u = new URL('/api/places', window.location.origin)
      const cityArg = (opts?.city ?? city).trim()
      if (cityArg) u.searchParams.set('city', cityArg)
      if (opts?.type) u.searchParams.set('types', opts.type)
      if (opts?.vibe) u.searchParams.set('vibes', opts.vibe)
      u.searchParams.set('limit', '24')
      const r = await fetch(u.toString())
      const j = await r.json()
      const list: UIPlace[] = j.places || []
      setPlaces(list)
      setIdx(0)
    } catch (e) {
      console.error(e)
      setPlaces([])
      setIdx(0)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchPlaces({ city })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Rotate featured place every 10 seconds
  useEffect(() => {
    if (places.length <= 1) return
    const id = setInterval(() => {
      setIdx((i) => {
        if (places.length <= 1) return 0
        // pick a different random index
        let next = i
        while (next === i && places.length > 1) {
          next = Math.floor(Math.random() * places.length)
        }
        return next
      })
    }, 10000)
    return () => clearInterval(id)
  }, [places.length])

  // Featured place photo gallery
  function Featured({ p }: { p: UIPlace }) {
    const [photos, setPhotos] = useState<string[]>([])
    const [photoIdx, setPhotoIdx] = useState(0)

    useEffect(() => {
      let on = true
      setPhotos([])
      setPhotoIdx(0)
      const u = new URL('/api/google/place-details', window.location.origin)
      u.searchParams.set('name', p.name)
      u.searchParams.set('city', p.city)
      u.searchParams.set('lat', String(p.lat))
      u.searchParams.set('lng', String(p.lng))
      fetch(u.toString())
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!on) return
          const arr = Array.isArray(d?.photos)
            ? (d.photos as string[])
            : d?.photoUrl
            ? [d.photoUrl as string]
            : []
          setPhotos(arr)
        })
        .catch(() => on && setPhotos([]))
      return () => {
        on = false
      }
    }, [p.id])

    // auto-rotate photos every 4s
    useEffect(() => {
      if (photos.length <= 1) return
      const id = setInterval(() => setPhotoIdx((i) => (i + 1) % photos.length), 4000)
      return () => clearInterval(id)
    }, [photos.length])

    const image = photos[photoIdx] || `https://maps.googleapis.com/maps/api/staticmap?center=${p.lat},${p.lng}&zoom=15&size=1000x600&maptype=roadmap&markers=color:red|${p.lat},${p.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`

    return (
      <a href={p.google_url} target="_blank" rel="noreferrer" className="block rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md transition">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={p.name} className="h-full w-full object-cover" />
          {photos.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              {photos.slice(0,6).map((_, i) => (
                <span key={i} className={clsx('h-1.5 w-6 rounded-full', i === photoIdx ? 'bg-white/90' : 'bg-white/40')} />
              ))}
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="text-2xl font-serif font-semibold text-slate-900">{p.name}</div>
          {p.description && <p className="mt-2 text-slate-700 line-clamp-3">{p.description}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {(p.types || []).slice(0, 3).map((t) => (
              <span key={t} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{t}</span>
            ))}
            {(p.themes || []).slice(0, 2).map((t) => (
              <span key={t} className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">{t}</span>
            ))}
          </div>
        </div>
      </a>
    )
  }

  // single-select pills
  function SinglePill({
    label,
    active,
    onClick,
  }: {
    label: string
    active: boolean
    onClick: () => void
  }) {
    return (
      <button
        onClick={onClick}
        className={clsx(
          'rounded-full border px-3 py-1.5 text-sm transition',
          active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
        )}
      >
        {label}
      </button>
    )
  }

  // handlers
  const applyFilters = () => fetchPlaces({ city, type: typeSel, vibe: vibeSel })

  return (
    <section className="bg-[#F7F5EF] py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-serif font-semibold text-slate-900">Explore places</h2>
          <p className="text-slate-600 mt-1">Pick a city and refine by place type and vibe. One from each.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 items-start">
          {/* Left: featured place */}
          <div>
            {loading ? (
              <div className="text-slate-600">Loading…</div>
            ) : places.length === 0 ? (
              <div className="text-slate-600">No places match your filters.</div>
            ) : (
              <Featured p={places[idx]} />
            )}
          </div>

          {/* Right: controls */}
          <div className="md:pl-6">
            <div className="flex items-center gap-2">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm w-full max-w-[220px]"
                placeholder="Paris"
              />
              <button onClick={applyFilters} className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-semibold">Refresh</button>
            </div>

            <div className="mt-6">
              <div className="text-xs font-medium text-slate-500 mb-2">TYPE</div>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map((t) => (
                  <SinglePill
                    key={t}
                    label={t}
                    active={typeSel === t}
                    onClick={() => {
                      const next = typeSel === t ? null : t
                      setTypeSel(next)
                      fetchPlaces({ city, type: next, vibe: vibeSel })
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="text-xs font-medium text-slate-500 mb-2">VIBE</div>
              <div className="flex flex-wrap gap-2">
                {vibeOptions.map((v) => (
                  <SinglePill
                    key={v}
                    label={v}
                    active={vibeSel === v}
                    onClick={() => {
                      const next = vibeSel === v ? null : v
                      setVibeSel(next)
                      fetchPlaces({ city, type: typeSel, vibe: next })
                    }}
                  />
                ))}
              </div>
            </div>

            {places.length > 1 && (
              <div className="mt-6 text-sm text-slate-600">
                Showing <span className="font-medium">{idx + 1}</span> of {places.length}. Rotates every 10s.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------- Page ---------------------------- */

export default function Page() {
  const images = useMemo(
    () => [
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&auto=format&fit=crop&w=2000&h=1200', // Paris
      'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?q=80&auto=format&fit=crop&w=2000&h=1200', // London
      'https://images.unsplash.com/photo-1464790719320-516ecd75af6c?q=80&auto=format&fit=crop&w=2000&h=1200', // Barcelona
      'https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?q=80&auto=format&fit=crop&w=2000&h=1200', // Rome
    ],
    [],
  )

  const [frame, setFrame] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % images.length), 5000)
    return () => clearInterval(id)
  }, [images.length])

  // Freeform prompt
  const [prompt, setPrompt] = useState(
    '5-day trip to Paris exploring nightlife, local restaurants, and art events',
  )
  const [showPrefs, setShowPrefs] = useState(false)

  // Preferences
  const [days, setDays] = useState(5)
  const [pace, setPace] = useState<'relaxed' | 'balanced' | 'packed'>('balanced')
  const [style, setStyle] = useState<'hidden' | 'mixed' | 'iconic'>('mixed')
  const [budget, setBudget] = useState<number>(3)
  const [wake, setWake] = useState<'early' | 'standard' | 'late'>('standard')
  const [city, setCity] = useState<string>('')
  const [cityError, setCityError] = useState<string>('')

  const [selectedCats, setSelectedCats] = useState<Record<string, boolean>>({
    cafes: false,
    restaurants: false,
    bars: false,
    museums: false,
    galleries: false,
    architecture: false,
    live_music: false,
    parties: false,
    nightlife: false,
    parks: false,
    walks: false,
    sports: false,
  })

  function extractDestination(text: string): string {
    const m = text.match(/to\s+([A-Za-zÀ-ÿ\s-]+)/i)
    if (m && m[1]) return m[1].trim().split(/[\.,;!]/)[0].trim()
    const m2 = text.match(/\b([A-Z][A-Za-zÀ-ÿ-]+)\b/)
    return m2 && m2[1] ? m2[1] : 'Paris'
  }

  const destination = useMemo(() => extractDestination(prompt), [prompt])

  // Free-text CTA: uses prompt
  const planPromptHref = useMemo(() => {
    const params = new URLSearchParams()
    params.set('d', destination)
    if (city.trim()) params.set('city', city.trim())
    params.set('budget', String(budget))
    params.set('pace', pace)
    params.set('days', String(days))
    params.set('wake', wake)
    const interests = Object.entries(selectedCats)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(',')
    if (interests) params.set('interests', interests)
    params.set('autostart', '1')
    params.set('q', prompt)
    return `/plan?${params.toString()}`
  }, [destination, city, budget, pace, prompt, days, wake, selectedCats])

  // Preferences CTA: ignores prompt entirely
  const planPrefsHref = useMemo(() => {
    const params = new URLSearchParams()
    if (city.trim()) {
      params.set('d', city.trim())
      params.set('city', city.trim())
    } else {
      params.set('d', destination)
    }
    params.set('budget', String(budget))
    params.set('pace', pace)
    params.set('days', String(days))
    params.set('wake', wake)
    const interests = Object.entries(selectedCats)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(',')
    if (interests) params.set('interests', interests)
    params.set('autostart', '1')
    return `/plan?${params.toString()}`
  }, [destination, city, budget, pace, days, wake, selectedCats])

  return (
    <main className="min-h-screen w-full bg-slate-50">
      <Hero
        prompt={prompt}
        setPrompt={setPrompt}
        showPrefs={showPrefs}
        setShowPrefs={setShowPrefs}
        budget={budget}
        setBudget={setBudget}
        pace={pace}
        setPace={setPace}
        style={style}
        setStyle={setStyle}
        days={days}
        setDays={setDays}
        wake={wake}
        setWake={setWake}
        selectedCats={selectedCats}
        setSelectedCats={setSelectedCats}
        images={images}
        frame={frame}
        city={city}
        setCity={setCity}
        cityError={cityError}
        setCityError={setCityError}
        planPromptHref={planPromptHref}
        planPrefsHref={planPrefsHref}
        destination={destination}
      />

  {/* NEW: Explore places from Supabase */}
  <ExplorePlaces />

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