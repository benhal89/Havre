// Shared domain types used across “Area explorer”
// Keep this file dependency-free.

export type SlotKey =
  | 'cafe'
  | 'gallery'
  | 'lunch'
  | 'walk'
  | 'bar'
  | 'dinner'
// add more as needed: 'breakfast' | 'brunch' | 'museum' | 'shop' | ...

export type Area = {
  /** Canonical area / quartier name (e.g., "Le Marais") */
  name: string
  /** [lat, lng] centroid used for nearby filtering */
  center: [number, number]
  /** Optional cover/hero image for the area */
  image?: string
}

export type Place = {
  id: string
  status?: 'active' | 'hidden' | 'draft'
  name: string
  description?: string | null
  url?: string | null           // googleUrl if present
  website?: string | null
  phone?: string | null
  address?: string | null
  neighborhood?: string | null
  city: string
  country: string
  lat: number
  lng: number
  tz?: string | null
  tags?: string[] | null
  types?: string[] | null       // e.g. ['cafe','restaurant','gallery']
  cuisines?: string[] | null
  themes?: string[] | null      // e.g. ['date_night','good_for_solo']
  rating?: number | null
  rating_source?: string | null
  price_level?: number | null   // 1..5
  opening_hours?: any | null
  hours?: any | null
  google_place_id?: string | null
  image_url?: string | null     // optional, if you store a lead photo
}

export type AreaDay = {
  area: Area
  /** 1–2 sentences describing the vibe/plan for the day */
  summary: string
  /** Slot layout for the day; null = empty slot needing a pick */
  slots: Record<SlotKey, Place | null>
}

/** Basic user prefs used for scoring/filtering */
export type Prefs = {
  city: string
  budget: 1 | 2 | 3 | 4 | 5
  pace: 'relaxed' | 'balanced' | 'packed'
  wake?: 'early' | 'standard' | 'late'
  interests?: string[]          // e.g. ['cafes','restaurants','galleries']
  style?: 'hidden' | 'mixed' | 'iconic'
}