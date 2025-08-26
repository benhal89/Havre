'use client'

export default function GoogleLinkField(props: {
  value: string
  onChange: (v:string)=>void
  onAutofill: ()=>void
}) {
  return (
    <div className="rounded-xl border bg-slate-50 p-4">
      <label className="text-xs font-medium text-slate-700">Paste a Google Maps link</label>
      <div className="mt-2 flex gap-2">
        <input
          value={props.value}
          onChange={e=>props.onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
          placeholder="https://maps.app.goo.gl/…"
        />
        <button
          onClick={props.onAutofill}
          className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
          type="button"
        >
          Autofill
        </button>
      </div>
    </div>
  )
}