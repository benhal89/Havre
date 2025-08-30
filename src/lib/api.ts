// src/lib/api.ts
import type { Area } from '@/lib/types'

export async function suggestAreas(params: {
  city: string
  interests?: string[]
  limit?: number
}): Promise<Area[]> {
  const res = await fetch('/api/areas/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error(`suggestAreas failed: ${res.status}`)
  const json = await res.json()
  return json.areas as Area[]
}