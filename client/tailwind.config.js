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
          navy: '#0A1128',
          slate: '#1E293B',
          teal: '#0F766E',
          'teal-light': '#14B8A6',
          'teal-dark': '#042F2E',
          charcoal: '#121212',
          gold: '#D4AF37',
          'gold-light': '#F4E5B1',
          'gold-dark': '#AA8B2C'
        },
        rks: {
          bg: '#FAF9F6', 
          bgDark: '#0A0C10',
          card: '#FFFFFF',
          cardDark: '#12161F',
          surface: '#F4F4F5',
          surfaceDark: '#1E2532',
          border: '#E4E4E7',
          borderDark: '#2D3748',
        },
      },
      fontFamily: {
        sans: ['"Outfit"', 'sans-serif'],
        heading: ['"Playfair Display"', 'serif'],
      },
      boxShadow: {
        'luxury': '0 20px 40px -10px rgba(0, 0, 0, 0.08)',
        'luxury-dark': '0 20px 40px -15px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(212, 175, 55, 0.15)',
      },
    },
  },
  plugins: [],
}
