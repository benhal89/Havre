'use client'
import { useState } from 'react'
import GoogleLinkField from './GoogleLinkField'
import PriceSlider from './PriceSlider'
import TypeSelect from './TypeSelect'

export default function AddPlaceForm() {
  // form state
  const [mapsLink, setMapsLink] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState<'restaurant' | 'cafe' | 'wine_bar' | 'bar' | 'club' | 'market' | 'museum' | 'gallery' | 'theatre' | 'landmark' | 'park' | 'garden' | 'rooftop' | 'boutique' | 'spa' | 'event_venue' | 'neighborhood_walk'>('restaurant')
  const [city, setCity] = useState('Paris')
  const [country, setCountry] = useState('France')
  const [price, setPrice] = useState(3)
  const [neighborhood, setNeighborhood] = useState('')
  const [website, setWebsite] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')

  const [position, setPosition] = useState<{ lat:number; lng:number } | null>(null)

  // UX
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function handleAutofill() {
    setErr(null); setMsg(null)
    try {
      setLoadingDetails(true)
      const u = new URL('/api/admin/resolve-place', window.location.origin)
      u.searchParams.set('url', mapsLink)
      const res = await fetch(u.toString(), { method: 'GET' })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed to resolve place')
      if (j.name) setName(j.name)
      if (j.city) setCity(j.city)
      if (j.country) setCountry(j.country)
      if (j.address) setAddress(j.address)
      if (j.neighborhood) setNeighborhood(j.neighborhood)
      if (j.website) setWebsite(j.website)
      if (j._summary) setDescription(j._summary)
      if (typeof j.price_level === 'number') setPrice(Math.min(Math.max(j.price_level + 1, 1), 5))
      if (j.lat && j.lng) setPosition({ lat: j.lat, lng: j.lng })
      setMsg('Autofilled from Google.')
    } catch (e:any) {
      setErr(e?.message || 'Autofill failed')
    } finally {
      setLoadingDetails(false)
    }
  }

  async function handleSubmit() {
    setSubmitting(true); setErr(null); setMsg(null)
    try {
      const payload = {
        name, city, country,
        neighborhood: neighborhood || null,
        address: address || null,
        lat: position?.lat,
        lng: position?.lng,
        price_level: price,
        types: [type],
        description: description || null,
        website: website || null,
        status: 'draft',
      }
      const res = await fetch('/api/admin/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Insert failed')
      setMsg('Saved as draft. Review in Supabase and mark status=active when ready.')
      setMapsLink(''); setName(''); setAddress(''); setNeighborhood(''); setWebsite(''); setDescription('')
    } catch (e:any) {
      setErr(e?.message || 'Save failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <GoogleLinkField
        value={mapsLink}
        onChange={setMapsLink}
        onAutofill={handleAutofill}
      />

      <div className="grid gap-5 md:grid-cols-2 mt-6">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" className="border rounded p-2" />
        <TypeSelect value={type} onChange={setType} />
        <input value={city} onChange={e=>setCity(e.target.value)} placeholder="City" className="border rounded p-2" />
        <input value={country} onChange={e=>setCountry(e.target.value)} placeholder="Country" className="border rounded p-2" />
      </div>

      <PriceSlider value={price} onChange={setPrice} className="mt-6" />

      <div className="grid gap-5 md:grid-cols-2 mt-6">
        <input value={neighborhood} onChange={e=>setNeighborhood(e.target.value)} placeholder="Neighborhood" className="border rounded p-2" />
        <input value={website} onChange={e=>setWebsite(e.target.value)} placeholder="Website" className="border rounded p-2" />
      </div>

      <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Address" className="w-full border rounded p-2 mt-5" />
      <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" rows={3} className="w-full border rounded p-2 mt-5" />

      <div className="mt-6 flex items-center gap-3">
        <button onClick={handleSubmit} disabled={submitting} className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60">
          {submitting ? 'Saving…' : 'Save draft'}
        </button>
      </div>

      {err && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}
      {msg && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{msg}</div>}
    </div>
  )
}
