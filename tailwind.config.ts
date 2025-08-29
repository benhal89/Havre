import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",  // make sure this points to your src folder
  ],
  theme: {
    extend: {
      colors: {
        beige: "#f9f7f6",
        midnight: "#222",
        gold: "#D4AF37",
        emerald: "#10b981",
      },
    },
  },
  plugins: [],
}
export default config