/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontSize: {
        'fluid-sm': 'clamp(0.8rem, 0.17vw + 0.76rem, 0.89rem)',
        'fluid-base': 'clamp(1rem, 0.34vw + 0.91rem, 1.19rem)',
        'fluid-lg': 'clamp(1.25rem, 0.61vw + 1.1rem, 1.58rem)',
        'fluid-xl': 'clamp(1.56rem, 1vw + 1.31rem, 2.11rem)',
        'fluid-2xl': 'clamp(1.95rem, 1.56vw + 1.56rem, 2.81rem)',
        'fluid-3xl': 'clamp(2.44rem, 2.38vw + 1.85rem, 3.75rem)',
      },
      colors: {
        'primary-black': '#080808',
        'premium-gold': '#D4AF37',
        'gold-light': '#E5C365',
        'gold-dark': '#B58D21',
        'charcoal': '#121212',
        'light-bg': '#F8F8F6',
        'cream-bg': '#FCFCFA',
        'text-primary': '#111111',
        'text-secondary': '#555555',
        'text-muted': '#999999',
        'border-light': '#EEEEEE',
        'border-dark': '#DDDDDD',
        'stock-in': '#059669',
        'stock-out': '#DC2626',
        'stock-low': '#F59E0B',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #F4E5C2 100%)',
        'dark-gradient': 'linear-gradient(135deg, #080808 0%, #121212 100%)',
      },
      boxShadow: {
        'gold': '0 4px 25px rgba(212, 175, 55, 0.2)',
        'premium': '0 10px 40px rgba(0,0,0,0.04)',
      }
    },
  },
  plugins: [],
};
