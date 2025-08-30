import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type PlaceRow = {
  id: string; name: string; lat: number; lng: number;
  types: string[] | null; cuisines: string[] | null; themes: string[] | null;
  summary?: string | null; description?: string | null; website?: string | null; opening_hours?: any;
  rating?: number | null;
}

function toRad(n:number){return n*Math.PI/180}
function haversineKm(aLat:number,aLng:number,bLat:number,bLng:number){
  const R=6371, dLat=toRad(bLat-aLat), dLng=toRad(bLng-aLng)
  const s=Math.sin(dLat/2)**2+Math.cos(toRad(aLat))*Math.cos(toRad(bLat))*Math.sin(dLng/2)**2
  return 2*R*Math.asin(Math.min(1,Math.sqrt(s)))
}

function isOpenNow(opening_hours:any, now=new Date()){
  if(!opening_hours||typeof opening_hours!=='object') return false
  const days=['sun','mon','tue','wed','thu','fri','sat'] as const
  const key=days[now.getDay()]
  const spec: string|undefined = opening_hours[key]
  if(!spec || /closed/i.test(spec)) return false
  const mins=now.getHours()*60+now.getMinutes()
  for(const span of spec.split(',').map(s=>s.trim())){
    const m=span.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/); if(!m) continue
    const start=Number(m[1])*60+Number(m[2]), end=Number(m[3])*60+Number(m[4])
    if(mins>=start && mins<=end) return true
  }
  return false
}

export async function GET(req: Request){
  try{
    const url=new URL(req.url)
    const lat=Number(url.searchParams.get('lat')||'NaN')
    const lng=Number(url.searchParams.get('lng')||'NaN')
    const radiusKm=Number(url.searchParams.get('radius_km')||'1.5')
    const limit=Number(url.searchParams.get('limit')||'12')
    const tagsCsv=(url.searchParams.get('tags')||'').toLowerCase()
    const openNowOnly=url.searchParams.get('open_now')==='1'
    if(!isFinite(lat)||!isFinite(lng)) return NextResponse.json({error:'lat/lng required'},{status:400})

    const tags=tagsCsv.split(',').map(s=>s.trim()).filter(Boolean)
    const typeTags=new Set<string>(), themeTags=new Set<string>(), cuisineTags=new Set<string>()
    for(const t of tags){
      if(['restaurant','cafe','bar','club','market','museum','gallery','park','garden','landmark','rooftop','hike','beach'].includes(t)) typeTags.add(t)
      else if(['date_night','good_for_solo','family_friendly','photo_spot','architecture','design','street_art'].includes(t)) themeTags.add(t)
      else{ if(t==='food') typeTags.add('restaurant'); if(t==='coffee') typeTags.add('cafe'); if(t==='nightlife'){typeTags.add('bar'); typeTags.add('club')} if(t==='wine') typeTags.add('wine_bar') }
    }

  const supabase = supabaseService()
    let q=supabase.from('places').select('*').eq('status','active').limit(500)
    if(typeTags.size)    q=q.overlaps('types',Array.from(typeTags))
    if(themeTags.size)   q=q.overlaps('themes',Array.from(themeTags))
    if(cuisineTags.size) q=q.overlaps('cuisines',Array.from(cuisineTags))
    const {data, error}=await q
    if(error) throw new Error(error.message)

    const now=new Date()
    const scored=(data as PlaceRow[])
      .filter(p=>typeof p.lat==='number' && typeof p.lng==='number')
      .map(p=>{
        const dKm=haversineKm(lat,lng,p.lat,p.lng)
        const open=isOpenNow(p.opening_hours, now)
        return {
          id:p.id, name:p.name, lat:p.lat, lng:p.lng,
          tags:[...(p.types||[]),...(p.cuisines||[]),...(p.themes||[])],
          summary:(p.summary ?? p.description ?? null) as string|null,
          url:(p.website ?? null) as string|null,
          distance_km:dKm, is_open:open, rating:p.rating ?? null
        }
      })
      .filter(x=>x.distance_km<=radiusKm && (!openNowOnly || x.is_open))
      .sort((a,b)=> a.distance_km!==b.distance_km ? a.distance_km-b.distance_km : (b.rating??0)-(a.rating??0))
      .slice(0,limit)

    return NextResponse.json({results: scored})
  }catch(e:any){
    return NextResponse.json({error:e?.message||'Nearby failed'},{status:500})
  }
}