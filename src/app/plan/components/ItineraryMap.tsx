'use client'
import { useEffect, useRef } from 'react'
import type { Itinerary } from '../page'

export default function ItineraryMap({ days }: { days: Itinerary['days'] }) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const g = (window as any).google
    if (!g?.maps || !mapRef.current) return

    const pts = days.flatMap(d =>
      d.activities
        .filter(a => typeof a.lat === 'number' && typeof a.lng === 'number')
        .map(a => ({ pos: { lat: a.lat!, lng: a.lng! }, title: a.title }))
    )

    const map = new g.maps.Map(mapRef.current, {
      zoom: 13,
      center: pts[0]?.pos || { lat: 48.8566, lng: 2.3522 },
    })

    const bounds = new g.maps.LatLngBounds()
    const path: any[] = []
    pts.forEach((p, i) => {
      new g.maps.Marker({ position: p.pos, label: String(i + 1), map, title: p.title })
      bounds.extend(p.pos)
      path.push(p.pos)
    })

    if (!bounds.isEmpty()) map.fitBounds(bounds, 50)

    if (path.length >= 2) {
      new g.maps.Polyline({
        path,
        strokeColor: '#0ea5e9',
        strokeWeight: 3,
        map,
      })
    }
  }, [days])

  return <div ref={mapRef} className="h-[400px] w-full rounded-xl border" />
}