module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Map to your CSS variables from globals.css
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',

        ivory: 'var(--color-ivory)',
        midnight: 'var(--color-midnight)',
        emerald: 'var(--color-emerald)',
        beige: 'var(--color-beige)',
        terracotta: 'var(--color-terracotta)',
        gold: 'var(--color-gold)',

        // legacy tokens some components referenced
        bg: 'var(--color-bg)',
        text: 'var(--color-text)',
        accent: 'var(--color-accent)',
        muted: 'var(--color-muted)',
        card: 'var(--color-card)',
        border: 'var(--color-border)',
      },
      fontFamily: {
        // Use the CSS vars you defined in globals.css
        sans: ['var(--font-sans)'],
        serif: ['var(--font-serif)'],
      },
      boxShadow: {
        glass: '0 10px 30px rgba(13, 27, 42, 0.08)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}