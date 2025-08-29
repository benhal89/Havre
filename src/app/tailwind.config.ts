import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#0f172a',
        beige: '#e7dfd3',
        gold: '#D4AF37',
        emerald: '#10b981',
      },
      boxShadow: {
        glass: '0 10px 25px -5px rgba(0,0,0,0.2)',
      },
      backdropBlur: {
        xs: '3px',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config