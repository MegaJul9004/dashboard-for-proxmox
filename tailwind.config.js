/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#070a12',
          900: '#0b0f1a',
          850: '#0e1320',
          800: '#121829',
          750: '#161d31',
          700: '#1b2238',
          600: '#273049',
          500: '#3a4566',
          400: '#5a6789',
          300: '#8a96b5',
          200: '#b8c1d8',
          100: '#e2e8f5',
        },
        brand: {
          50: '#eaf6ff',
          100: '#d2ecff',
          200: '#a8d9ff',
          300: '#74c0ff',
          400: '#3aa0ff',
          500: '#1280f5',
          600: '#0a63d6',
          700: '#0a4eaa',
          800: '#0d4185',
          900: '#103262',
        },
        accent: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        success: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        warn: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(58,160,255,0.18), 0 8px 30px -8px rgba(18,128,245,0.35)',
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
        pop: '0 12px 40px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.6' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out both',
        'scale-in': 'scale-in 0.18s ease-out both',
        'slide-in': 'slide-in 0.3s cubic-bezier(0.16,1,0.3,1) both',
        shimmer: 'shimmer 1.6s linear infinite',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [],
};
