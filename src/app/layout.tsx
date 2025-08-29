import './globals.css'
import type { Metadata } from 'next'
import { Inter, Geist_Mono, Playfair_Display } from 'next/font/google'
import Script from 'next/script'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
})

const mono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

const serif = Playfair_Display({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['400','700'],
})

export const metadata: Metadata = {
  title: 'Havre',
  description: 'Plan smarter trips in minutes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google Maps JS (Places, etc.) */}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places`}
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${inter.variable} ${mono.variable} ${serif.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}