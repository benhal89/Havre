'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

// Add global type for google on window
declare global {
  interface Window {
    google?: any
  }
}
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Sparkles, SlidersHorizontal, PiggyBank, Banknote, Wallet, CreditCard, Gem,
  Utensils, Palette, Moon, Trees, Landmark, Users, Coffee, Wine,
  ShoppingBag, Building2, Library, Camera, MapPin,
} from 'lucide-react'

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=60&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=60&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1545569341-9eb8b30979d0?q=60&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?q=60&w=2000&auto=format&fit=crop',
]

type BudgetLevel = 1 | 2 | 3 | 4 | 5
type BudgetOption = { level: BudgetLevel; label: string; icon: ReactNode }
const BUDGETS: BudgetOption[] = [
  { level: 1, label: 'Shoestring', icon: <PiggyBank className="h-5 w-5" /> },
  { level: 2, label: 'Value',      icon: <Banknote className="h-5 w-5" /> },
  { level: 3, label: 'Comfort',    icon: <Wallet className="h-5 w-5" /> },
  { level: 4, label: 'Premium',    icon: <CreditCard className="h-5 w-5" /> },
  { level: 5, label: 'Luxury',     icon: <Gem className="h-5 w-5" /> },
]

type InterestKey =
  | 'food' | 'art' | 'nightlife' | 'outdoors' | 'landmarks' | 'family'
  | 'coffee' | 'wine' | 'shopping' | 'architecture' | 'history' | 'photography'

type InterestOption = { key: InterestKey; label: string; icon: ReactNode }
const INTERESTS: InterestOption[] = [
  { key: 'food',         label: 'Food',         icon: <Utensils className="h-6 w-6" /> },
  { key: 'art',          label: 'Art',          icon: <Palette className="h-6 w-6" /> },
  { key: 'nightlife',    label: 'Nightlife',    icon: <Moon className="h-6 w-6" /> },
  { key: 'outdoors',     label: 'Outdoors',     icon: <Trees className="h-6 w-6" /> },
  { key: 'landmarks',    label: 'Landmarks',    icon: <Landmark className="h-6 w-6" /> },
  { key: 'family',       label: 'Family',       icon: <Users className="h-6 w-6" /> },
  { key: 'coffee',       label: 'Coffee',       icon: <Coffee className="h-6 w-6" /> },
  { key: 'wine',         label: 'Wine',         icon: <Wine className="h-6 w-6" /> },
  { key: 'shopping',     label: 'Shopping',     icon: <ShoppingBag className="h-6 w-6" /> },
  { key: 'architecture', label: 'Architecture', icon: <Building2 className="h-6 w-6" /> },
  { key: 'history',      label: 'History',      icon: <Library className="h-6 w-6" /> },
  { key: 'photography',  label: 'Photography',  icon: <Camera className="h-6 w-6" /> },
]

type HoursPref = 'early' | 'balanced' | 'late'
type PacePref = 'chill' | 'balanced' | 'packed'

type PlacePick = {
  name: string
  address: string
  lat: number
  lng: number
}

function PlacesAutocomplete({
  value,
  onPick,
  placeholder = 'e.g., Le Marais or Hotel Grand Amour',
}: {
  value?: string
  onPick: (p: PlacePick) => void
  placeholder?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // wait for google script
    if (!window.google?.maps?.places || !inputRef.current) return
    const ac = new window.google.maps.places.Autocomplete(inputRef.current!, {
      fields: ['name', 'formatted_address', 'geometry'],
      types: ['establishment'],
    })
    ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      const loc = place.geometry?.location
      if (!loc) return
      onPick({
        name: place.name || place.formatted_address || 'Home base',
        address: place.formatted_address || '',
        lat: loc.lat(),
        lng: loc.lng(),
      })
      if (inputRef.current) inputRef.current.value = place.name || place.formatted_address || ''
    })
    return () => { /* no cleanup needed */ }
  }, [onPick])

  return (
    <input
      ref={inputRef}
      defaultValue={value}
      className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-200 text-slate-900 placeholder:text-slate-400"
      placeholder={placeholder}
    />
  )
}

export default function HomePage() {
  const [homeBaseName, setHomeBaseName] = useState('')
  const [homeCoords, setHomeCoords] = useState<{lat:number; lng:number} | null>(null)

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Hero
        homeBaseName={homeBaseName}
        setHomeBaseName={setHomeBaseName}
        homeCoords={homeCoords}
        setHomeCoords={setHomeCoords}
      />
      <Inspiration />
      <HowItWorks />
      <FinalCTA />
      <Footer />
    </main>
  )
}

function Hero({
  homeBaseName,
  setHomeBaseName,
  homeCoords,
  setHomeCoords,
}: {
  homeBaseName: string
  setHomeBaseName: (name: string) => void
  homeCoords: { lat: number; lng: number } | null
  setHomeCoords: (coords: { lat: number; lng: number } | null) => void
}) {
  const [index, setIndex] = useState(0)
  const [showPrefs, setShowPrefs] = useState(false)
  const router = useRouter()

  const [prompt, setPrompt] = useState('5-day weekend in Paris with great food and clubbing')
  const [destination, setDestination] = useState('Paris')
  const [numDays, setNumDays] = useState(5)

  const [hoursPref, setHoursPref] = useState<HoursPref>('balanced')
  const [pace, setPace] = useState<PacePref>('balanced')

  const [budget, setBudget] = useState<BudgetLevel>(3)
  const [selected, setSelected] = useState<Set<InterestKey>>(new Set(['food', 'nightlife', 'landmarks']))

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % HERO_IMAGES.length), 5000)
    return () => clearInterval(id)
  }, [])

  function goToPlan(params: URLSearchParams) {
    router.push(`/plan?${params.toString()}`)
  }
  function datesFromNumDays(days: number) {
    const start = new Date()
    const end = new Date(start.getTime() + Math.max(0, days - 1) * 86400000)
    const s = start.toISOString().slice(0, 10)
    const e = end.toISOString().slice(0, 10)
    return `${s} to ${e}`
  }
  function startWithChat() {
    const p = new URLSearchParams()
    p.set('q', prompt)
    p.set('autostart', '1')
    goToPlan(p)
  }
  function startWithPrefs() {
    const p = new URLSearchParams()
    if (destination) p.set('d', destination)
    p.set('dates', datesFromNumDays(numDays))
    if (homeBaseName) p.set('home_name', homeBaseName)
    if (homeCoords) {
      p.set('home_lat', String(homeCoords.lat))
      p.set('home_lng', String(homeCoords.lng))
    }
    if (hoursPref) p.set('hours', hoursPref)
    if (pace) p.set('pace', pace)
    if (selected.size) p.set('i', Array.from(selected).join(','))
    p.set('budget', String(budget))
    p.set('autostart', '1')
    goToPlan(p)
  }

  const NEIGHBORHOOD_SUGGESTIONS = [
    'Le Marais', 'Canal St-Martin', 'Latin Quarter', 'Bastille', 'Montmartre'
  ]

  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden">
      {/* Background image */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <AnimatePresence initial={false}>
          <motion.div
            key={HERO_IMAGES[index]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${HERO_IMAGES[index]})` }}
          />
        </AnimatePresence>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />

      {/* Foreground content */}
      <div className="relative z-20 mx-auto flex max-w-5xl flex-col items-center px-6 pb-12 pt-16 text-center md:pt-24">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-white backdrop-blur">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-medium tracking-wide">Havre · AI Travel Concierge</span>
        </div>

        <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-white md:text-6xl">
          Plan unforgettable trips in minutes.
        </h1>
        <p className="mt-3 max-w-2xl text-white/90 md:text-lg">
          Describe your trip or use a few choices—Havre crafts a day-by-day plan with maps, dining, and hidden gems.
        </p>

        {/* Chat input */}
        <div className="mt-6 w-full max-w-3xl rounded-2xl bg-white/85 p-3 backdrop-blur">
          <textarea
            className="h-28 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-sky-200"
            placeholder='e.g., "5-day weekend in Paris with great food and one club night"'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="mt-3 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={startWithChat}
              className="w-full rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 sm:w-auto"
            >
              Plan my trip
            </button>
            <button
              onClick={() => setShowPrefs((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-white"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {showPrefs ? 'Hide sliders & choices' : 'Prefer sliders & choices?'}
            </button>
          </div>
        </div>

        {/* Preferences panel */}
        <AnimatePresence initial={false}>
          {showPrefs && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-5 w-full max-w-4xl rounded-2xl border border-white/20 bg-white/90 p-5 text-left backdrop-blur"
            >
              <div className="grid gap-4 md:grid-cols-[1.2fr,0.8fr]">
                <div>
                  <label className="text-xs font-medium text-slate-600">Destination</label>
                  <div className="relative mt-2">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className="w-full rounded-lg border bg-white px-9 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="City or region"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Number of days</label>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={14}
                      value={numDays}
                      onChange={(e) => setNumDays(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="w-14 rounded-lg border bg-white px-3 py-2 text-center text-sm">{numDays}</div>
                  </div>
                </div>
              </div>

              {/* Home base */}
              <div className="mt-5">
                <label className="text-xs font-medium text-slate-600">
                  Where are you staying? (exact hotel / place)
                </label>
                <div className="mt-2">
                  <PlacesAutocomplete
                    value={homeBaseName}
                    onPick={(p) => {
                      setHomeBaseName(p.name)
                      setHomeCoords({ lat: p.lat, lng: p.lng })
                    }}
                    placeholder="Type a hotel or exact place…"
                  />
                </div>
              </div>

              {/* Hours preference */}
              <div className="mt-5">
                <label className="text-xs font-medium text-slate-600">When do you like to start your day?</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(['early','balanced','late'] as HoursPref[]).map(h => (
                    <button
                      key={h}
                      onClick={() => setHoursPref(h)}
                      className={`rounded-xl border px-3 py-2 text-sm ${
                        hoursPref === h ? 'border-sky-600 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                      type="button"
                    >
                      {h === 'early' ? 'Early bird' : h === 'late' ? 'Late riser' : 'Balanced'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pace */}
              <div className="mt-5">
                <label className="text-xs font-medium text-slate-600">How packed should we make it?</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(['chill','balanced','packed'] as PacePref[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setPace(p)}
                      className={`rounded-xl border px-3 py-2 text-sm ${
                        pace === p ? 'border-sky-600 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                      type="button"
                    >
                      {p === 'chill' ? 'Chill' : p === 'packed' ? 'Packed' : 'Balanced'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div className="mt-5">
                <label className="text-xs font-medium text-slate-600">Budget</label>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {BUDGETS.map(b => (
                    <button
                      key={b.level}
                      onClick={() => setBudget(b.level)}
                      className={`flex flex-col items-center rounded-xl border px-3 py-3 text-xs ${
                        budget === b.level
                          ? 'border-sky-600 bg-sky-50 text-sky-700'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                      type="button"
                    >
                      <div className="text-base">{b.label}</div>
                      <div className="mt-2">{b.icon}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div className="mt-5">
                <div className="text-xs font-medium text-slate-600">Interests</div>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {INTERESTS.map(it => {
                    const active = selected.has(it.key)
                    return (
                      <button
                        key={it.key}
                        onClick={() => {
                          setSelected(prev => {
                            const next = new Set(prev)
                            next.has(it.key) ? next.delete(it.key) : next.add(it.key)
                            return next
                          })
                        }}
                        className={`flex flex-col items-center rounded-xl border px-3 py-3 ${
                          active ? 'border-sky-600 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                        aria-pressed={active}
                        type="button"
                      >
                        <div className="text-xs font-medium">{it.label}</div>
                        <div className="mt-1">{it.icon}</div>
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-500">Tip: pick 3–6 interests for best results.</p>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={startWithPrefs}
                  className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
                >
                  Generate with choices
                </button>
                <Link href="/plan" className="text-sm text-slate-700 underline">
                  Open planner
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

/* --- Get inspired, How it works, CTA, Footer --- */

function formatReviews(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function Inspiration() {
  const items = [
    {
      title: 'Food lover',
      img: 'https://images.unsplash.com/photo-1541542684-4a593cdbed6d?q=60&w=1200&auto=format&fit=crop',
      i: 'food,natural wine,bistros',
      neighborhood: 'Canal St-Martin',
      rating: 4.7,
      reviews: 1200,
    },
    {
      title: 'Hidden gems & walks',
      img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=60&w=1200&auto=format&fit=crop',
      i: 'hidden gems,neighborhood walks',
      neighborhood: 'Buttes-Chaumont',
      rating: 4.6,
      reviews: 860,
    },
    {
      title: 'Nightlife & cocktails',
      img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=60&w=1200&auto=format&fit=crop',
      i: 'nightlife,cocktails,clubs',
      neighborhood: 'Oberkampf',
      rating: 4.5,
      reviews: 1420,
    },
    {
      title: 'Art & museums',
      img: 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?q=60&w=1200&auto=format&fit=crop',
      i: 'art,museums,architecture',
      neighborhood: 'Saint-Germain',
      rating: 4.8,
      reviews: 2100,
    },
  ] as const

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Get inspired</h2>
        <Link href="/explore" className="text-sm text-sky-700 underline">See more</Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((x, idx) => {
          const qs = new URLSearchParams({ i: x.i, autostart: '1' }).toString()
          return (
            <Link
              key={idx}
              href={`/plan?${qs}`}
              className="group overflow-hidden rounded-2xl border bg-white shadow-sm"
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-base font-semibold">{x.title}</div>
                  <div className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700">
                    ★ {x.rating.toFixed(1)} · {formatReviews(x.reviews)}
                  </div>
                </div>
                <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700">
                  <MapPin className="h-3.5 w-3.5" />
                  {x.neighborhood}
                </div>
                <div className="mt-2 text-sm text-slate-600">{x.i.split(',').join(', ')}</div>
              </div>
              <div
                className="h-44 w-full bg-cover bg-center transition group-hover:scale-105"
                style={{ backgroundImage: `url(${x.img})` }}
              />
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    {
      title: 'Share your vibe',
      desc: 'Start with a sentence or choose a few sliders. We keep it simple.',
      img: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?q=60&w=1200&auto=format&fit=crop',
    },
    {
      title: 'Smart curation',
      desc: 'Havre blends a curated database with AI to match your taste and pace.',
      img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=60&w=1200&auto=format&fit=crop',
    },
    {
      title: 'A day-by-day plan',
      desc: 'Clean schedule with maps, restaurants, bars, and tips you can refine.',
      img: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?q=60&w=1200&auto=format&fit=crop',
    },
  ]

  return (
    <section className="border-y bg-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="mb-8 text-center text-2xl font-semibold">How it works</h2>
        <div className="mx-auto max-w-3xl space-y-6">
          {steps.map((s, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border bg-slate-50/70 shadow-sm">
              <div className="h-40 w-full bg-cover bg-center" style={{ backgroundImage: `url(${s.img})` }} />
              <div className="p-5">
                <div className="text-base font-semibold">{i + 1}. {s.title}</div>
                <div className="mt-1 text-sm text-slate-600">{s.desc}</div>
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
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="rounded-3xl border bg-gradient-to-br from-sky-600 to-sky-700 p-8 text-white">
        <h3 className="text-2xl font-semibold">Ready to plan your next trip?</h3>
        <p className="mt-2 text-sky-50">Open the planner and get a draft itinerary in seconds.</p>
        <div className="mt-5 flex gap-3">
          <Link href="/plan" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-sky-700 shadow-sm hover:brightness-95">
            Open planner
          </Link>
          <Link href="/explore" className="rounded-xl border border-white/70 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10">
            Explore ideas
          </Link>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-sm text-slate-500">
        <p>© {new Date().getFullYear()} Havre</p>
        <div className="flex gap-4">
          <Link href="/plan" className="hover:text-slate-700">Plan</Link>
          <Link href="/features" className="hover:text-slate-700">Features</Link>
          <Link href="/pricing" className="hover:text-slate-700">Pricing</Link>
          <Link href="/admin/places/new" className="hover:text-slate-700">Add place</Link>
        </div>
      </div>
    </footer>
  )
}