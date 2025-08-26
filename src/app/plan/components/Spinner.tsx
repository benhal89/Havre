'use client'
import React from 'react'

export default function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="inline-flex items-center gap-2 text-slate-600">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  )
}