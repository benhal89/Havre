// src/app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Tenor_Sans, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import clsx from 'clsx'

// Map Tenor Sans into the CSS var your globals.css expects
// (globals.css uses --font-sans)
const tenor = Tenor_Sans({
  variable: '--font-sans',
  weight: '400',
  subsets: ['latin'],
})

const mono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Havre',
  description: 'Plan smarter trips in minutes.',
}

// Simple site-wide header
function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-slate-900 hover:text-sky-700">
          Havre
        </Link>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Home
          </Link>
          <Link
            href="/plan"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Plan
          </Link>
          <Link
            href="/explore"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Explore
          </Link>
          <Link
            href="/admin/places/new"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Add place
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={clsx(tenor.variable, mono.variable)}>
      <head>
        {/* Google Maps Places + JS API (loaded once globally) */}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places`}
          strategy="beforeInteractive"
        />
      </head>
      <body className="antialiased bg-[var(--color-bg)] text-[var(--color-text)]">
        <SiteHeader />
        <main>{children}</main>
      </body>
    </html>
  )
}