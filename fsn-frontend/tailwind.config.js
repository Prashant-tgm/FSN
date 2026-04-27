/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // FSN Brand – deep forest green
        fsn: {
          50:  '#F0F7F2',
          100: '#D6EDE0',
          200: '#AEDBBF',
          300: '#7DC49B',
          400: '#4DA876',
          500: '#2D8653',
          600: '#1F6640',
          700: '#1A4731',
          800: '#153825',
          900: '#0E2419',
        },
        // Warm amber accent
        gold: {
          50:  '#FDF8EE',
          100: '#FAEDCC',
          200: '#F5D899',
          300: '#EFBF5A',
          400: '#E8A328',
          500: '#C4873A',
          600: '#A86C28',
          700: '#87531C',
        },
        // Cream / warm neutral backgrounds (Estatia-inspired)
        cream: {
          50:  '#FDFAF5',
          100: '#F5F0E8',
          200: '#EDE6D8',
          300: '#E0D8C8',
        },
        // Near-black for dark sections
        ink: {
          900: '#0B0B0B',
          800: '#111111',
          700: '#1A1A1A',
          600: '#2A2A2A',
          500: '#404040',
          400: '#6E6B65',
          300: '#9A9690',
          200: '#C8C4BC',
          100: '#E5E0D8',
          50:  '#F2EEE8',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', '"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', '14px'],
      },
      letterSpacing: {
        widest2: '0.2em',
        widest3: '0.3em',
      },
      boxShadow: {
        'card':       '0 1px 4px rgba(11,11,11,0.06), 0 4px 16px rgba(11,11,11,0.04)',
        'card-hover': '0 8px 32px rgba(11,11,11,0.12), 0 2px 8px rgba(11,11,11,0.06)',
        'modal':      '0 24px 80px rgba(11,11,11,0.22)',
        'glow-green': '0 0 0 3px rgba(29,72,49,0.15)',
      },
      animation: {
        'marquee':    'marquee 28s linear infinite',
        'marquee2':   'marquee2 28s linear infinite',
        'fade-up':    'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        'scale-in':   'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
      },
      keyframes: {
        marquee:  { '0%': { transform: 'translateX(0%)' }, '100%': { transform: 'translateX(-100%)' } },
        marquee2: { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0%)' } },
        fadeUp:   { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:  { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
}
