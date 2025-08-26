// src/app/api/itinerary/route.ts
import { NextRequest, NextResponse } from 'next/server'

// Minimal types to match the planner page expectations
type Activity = {
  time?: string
  title: string
  description?: string
  lat?: number
  lng?: number
  tags?: string[]
}

type DayPlan = {
  date?: string
  activities: Activity[]
}

type Itinerary = {
  days: DayPlan[]
}

export async function POST(req: NextRequest) {
  let body: any = {}
  try {
    body = await req.json()
  } catch {}

  const { destination = 'Paris' } = body

  // Temporary sample itinerary so the UI works even without the DB.
  const sample: Itinerary = {
    days: [
      {
        activities: [
          {
            time: '09:30',
            title: 'Bistro Amour',
            description: 'Neo-bistro with natural wine, seasonal plates, lively counter.',
            tags: ['restaurant', 'neo_bistro', 'wine_bar'],
            lat: 48.8708,
            lng: 2.3349,
          },
          {
            time: '11:30',
            title: 'Atelier Saint‑Germain',
            description: 'Independent gallery spotlighting emerging artists.',
            tags: ['gallery'],
            lat: 48.853,
            lng: 2.33,
          },
          {
            time: '13:00',
            title: 'Musée des Arts Urbains',
            description: 'Contemporary space showcasing design & photography.',
            tags: ['museum'],
            lat: 48.863,
            lng: 2.352,
          },
          {
            time: '19:00',
            title: 'Bar à Vins Étoile',
            description: 'Intimate bar focused on natural and rare bottles.',
            tags: ['wine_bar'],
            lat: 48.864,
            lng: 2.31,
          },
        ],
      },
      {
        activities: [
          {
            time: '10:00',
            title: 'Canal St‑Martin stroll',
            description: 'Shady walk along the canal and coffee stops.',
            tags: ['walk', 'coffee'],
            lat: 48.872,
            lng: 2.366,
          },
          {
            time: '13:00',
            title: 'Le Déjeuner',
            description: 'Casual lunch near the canal.',
            tags: ['restaurant'],
            lat: 48.871,
            lng: 2.347,
          },
          {
            time: '15:00',
            title: 'Parc des Buttes‑Chaumont',
            description: 'Green hills with city views for an easy afternoon.',
            tags: ['park'],
            lat: 48.880,
            lng: 2.381,
          },
        ],
      },
    ],
  }

  return NextResponse.json({ destination, ...sample })
}

export async function GET() {
  return NextResponse.json({ ok: true, info: 'POST to this endpoint to generate an itinerary.' })
}