// src/app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { Tenor_Sans, Geist_Mono } from 'next/font/google'
import Script from 'next/script'

// Map Tenor Sans into the same CSS variable your globals.css expects
const tenor = Tenor_Sans({
  variable: '--font-geist-sans',
  weight: '400',
  subsets: ['latin'],
})

// Keep a mono font for code blocks (optional)
const mono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Havre',
  description: 'Plan smarter trips in minutes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google Maps Places + JS API */}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places`}
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${tenor.variable} ${mono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}