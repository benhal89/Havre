"use client"
import React from 'react'
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
      <div className="relative mt-2 w-full">
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value}
          onChange={e=>onChange(Number(e.target.value))}
          className="w-full accent-sky-600 h-2 bg-slate-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500"
          style={{ zIndex: 1, position: 'relative' }}
        />
        {/* Pointer above icon */}
        <div
          className="absolute left-0 top-[-18px] flex w-full justify-between pointer-events-none"
          style={{ zIndex: 2 }}
        >
          {[0,1,2,3,4].map(i => (
            <div key={i} className="w-0 flex justify-center" style={{ flex: 1 }}>
              {value-1 === i && (
                <div className="mx-auto h-3 w-3 rounded-full bg-sky-600 border-2 border-white shadow" />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1 flex justify-between text-xs text-slate-700 font-medium">
        <span>€</span><span>€€</span><span>€€€</span><span>€€€€</span><span>€€€€€</span>
      </div>
    </div>
  )
}