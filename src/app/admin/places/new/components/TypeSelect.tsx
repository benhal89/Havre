const TYPE_OPTIONS = [
  'restaurant','cafe','wine_bar','bar','club','market',
  'museum','gallery','theatre','landmark','park','garden',
  'rooftop','boutique','spa','event_venue','neighborhood_walk'
] as const

export default function TypeSelect({
  value, onChange,
}: { value: (typeof TYPE_OPTIONS)[number]; onChange: (v:any)=>void }) {
  return (
    <select
      value={value}
      onChange={e=>onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
    >
      {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t.replaceAll('_',' ')}</option>)}
    </select>
  )
}