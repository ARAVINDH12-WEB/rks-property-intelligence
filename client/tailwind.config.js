/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0B192C',
          slate: '#1E293B',
          emerald: '#0F766E',
          'emerald-light': '#14B8A6',
          'emerald-dark': '#042F2E',
          gold: '#B48C36',
          'gold-light': '#D4AF37',
          'gold-dark': '#8D6B22',
        },
        rks: {
          bg: '#070A0F',
          card: '#0F141E',
          surface: '#18202F',
          border: '#263347',
          muted: '#64748B',
          gold: {
            DEFAULT: '#D4AF37',
            light: '#E6CA65',
            dark: '#B08D26',
            hover: '#F2D77C',
          },
          status: {
            available: '#15803D',
            reserved: '#B45309',
            sold: '#B91C1C',
            blocked: '#475569',
            hold: '#A16207',
            upcoming: '#0E7490',
            draft: '#64748B',
          },
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'premium': '0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 0 1px 1px rgba(0, 0, 0, 0.04)',
        'premium-dark': '0 20px 40px -15px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.06)',
      },
    },
  },
  plugins: [],
}
