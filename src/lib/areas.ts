// src/lib/areas.ts
// Lightweight neighborhood metadata (extend over time).

const PARIS: Record<
  string,
  { cover: string; description: string; sights: string[] }
> = {
  'Le Marais': {
    cover:
      'https://images.unsplash.com/photo-1543357480-c60d40007a4e?auto=format&fit=crop&w=1800&q=80',
    description: 'Historic lanes, galleries and chic cafés.',
    sights: ['Place des Vosges', 'Musée Picasso', 'Rue des Rosiers'],
  },
  'Saint-Germain-des-Prés': {
    cover:
      'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1800&q=80',
    description: 'Left Bank salons, bookstores and timeless cafés.',
    sights: ['Café de Flore', 'Église Saint-Germain', 'Boulevard Saint-Germain'],
  },
  Montmartre: {
    cover:
      'https://images.unsplash.com/photo-1543349689-9a4d426bee8c?auto=format&fit=crop&w=1800&q=80',
    description: 'Bohemian hills, artists’ ateliers and sweeping views.',
    sights: ['Sacré-Cœur', 'Place du Tertre', 'Rue Lepic'],
  },
}

export function getAreaMeta(city: string, areaName: string) {
  const c = city.toLowerCase()
  if (c === 'paris') {
    const exact = PARIS[areaName]
    if (exact) return exact
    const alt = PARIS[normalize(areaName)]
    if (alt) return alt
  }
  // Fallback: generic Unsplash keyword
  return {
    cover: `https://source.unsplash.com/1600x400/?${encodeURIComponent(
      `${areaName} ${city} street`,
    )}`,
    description: `Explore ${areaName} — cafés, culture and good food.`,
    sights: [] as string[],
  }
}

function normalize(s: string) {
  return s.replace(/-/g, '-').replace(/\s+/g, ' ').trim()
}