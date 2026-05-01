/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
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
