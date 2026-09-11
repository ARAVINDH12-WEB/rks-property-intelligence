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
          navy: '#0B1E2D',
          'navy-light': '#162b3d',
          slate: '#1E293B',
          teal: '#0E7A5F',
          'teal-light': '#14B8A6',
          'teal-dark': '#064e3b',
          charcoal: '#1A242D',
          gold: '#C98A2C',
          'gold-light': '#F4E5B1',
          'gold-dark': '#9A661C',
          amber: '#C98A2C',
          'amber-dark': '#9A661C',
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
        'luxury-dark': '0 20px 40px -15px rgba(0, 0, 0, 0.6)',
        'premium': '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)',
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'elevated': '0 8px 24px rgba(0,0,0,0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { '0%': { opacity: '0', transform: 'translateX(16px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
}
