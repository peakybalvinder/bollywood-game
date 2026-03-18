/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        crimson: {
          900: '#3D0000',
          800: '#6B0000',
          700: '#8B0000',
          600: '#A50000',
          500: '#CC0000',
          400: '#E53333',
        },
        gold: {
          900: '#7A5900',
          800: '#A07500',
          700: '#C49200',
          600: '#E6AC00',
          500: '#FFD700',
          400: '#FFE566',
          300: '#FFF0A0',
        },
        ink: {
          950: '#0A0505',
          900: '#120808',
          800: '#1C0C0C',
          700: '#2A1010',
          600: '#3D1515',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'flicker': 'flicker 3s infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'reveal': 'reveal 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        bounceIn: { from: { opacity: 0, transform: 'scale(0.8)' }, to: { opacity: 1, transform: 'scale(1)' } },
        flicker: { '0%,100%': { opacity: 1 }, '92%': { opacity: 1 }, '93%': { opacity: 0.6 }, '94%': { opacity: 1 }, '96%': { opacity: 0.8 } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        pulseGold: { '0%,100%': { boxShadow: '0 0 8px #FFD700' }, '50%': { boxShadow: '0 0 24px #FFD700, 0 0 48px #FFD70066' } },
        shake: { '0%,100%': { transform: 'translateX(0)' }, '20%': { transform: 'translateX(-8px)' }, '40%': { transform: 'translateX(8px)' }, '60%': { transform: 'translateX(-4px)' }, '80%': { transform: 'translateX(4px)' } },
        reveal: { from: { opacity: 0, transform: 'translateY(-8px) scale(0.9)' }, to: { opacity: 1, transform: 'translateY(0) scale(1)' } },
      },
    },
  },
  plugins: [],
};
