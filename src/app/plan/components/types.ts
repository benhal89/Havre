export type Activity = {
  time?: string
  title: string
  details?: string
  mapUrl?: string
  tags?: string[]
  lat?: number
  lng?: number
  photoUrl?: string | null
}

export type DayPlan = {
  date?: string
  activities: Activity[]
}

export type Itinerary = {
  days: DayPlan[]
  notes?: string
}