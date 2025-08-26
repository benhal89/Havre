'use client'
export default function PriceSlider({
  value, onChange, className,
}: { value:number; onChange:(v:number)=>void; className?:string }) {
  const label = ['€','€€','€€€','€€€€','€€€€€'][value-1]
  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-slate-700">Price level *</div>
        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700">{label}</span>
      </div>
      <input type="range" min={1} max={5} step={1} value={value} onChange={e=>onChange(Number(e.target.value))} className="mt-2 w-full" />
      <div className="mt-1 flex justify-between text-xs text-slate-500">
        <span>€</span><span>€€</span><span>€€€</span><span>€€€€</span><span>€€€€€</span>
      </div>
    </div>
  )
}