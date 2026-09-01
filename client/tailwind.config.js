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
        rks: {
          bg: '#0A0C10',
          card: '#12161F',
          surface: '#1A202C',
          border: '#2A3446',
          muted: '#8E9BAE',
          gold: {
            DEFAULT: '#D4AF37',
            light: '#E6CA65',
            dark: '#B08D26',
            hover: '#F2D77C'
          },
          status: {
            available: '#10B981',
            reserved: '#F59E0B',
            sold: '#EF4444',
            blocked: '#64748B',
            hold: '#EAB308',
            upcoming: '#06B6D4',
            draft: '#94A3B8'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
