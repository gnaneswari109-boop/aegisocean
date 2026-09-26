/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f5fa',
          100: '#d9e4f2',
          200: '#b3c8e5',
          300: '#7da8d0',
          400: '#4a82b8',
          500: '#2e5f95',
          600: '#1f4775',
          700: '#16365a',
          800: '#0f2645',
          900: '#0a1a33',
          950: '#060f1f',
        },
        cyan: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        coral: {
          50: '#fff5f5',
          100: '#ffe0e0',
          200: '#ffc6c6',
          300: '#ff9d9d',
          400: '#ff6b6b',
          500: '#f04545',
          600: '#d92e2e',
          700: '#b51e1e',
          800: '#8f1717',
          900: '#6b1010',
        },
        success: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'sonar-pulse': 'sonar-pulse 3s ease-out infinite',
        'sonar-pulse-delayed': 'sonar-pulse 3s ease-out 1s infinite',
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'scan-line': 'scan-line 2s linear infinite',
        'blink': 'blink 1.5s ease-in-out infinite',
      },
      keyframes: {
        'sonar-pulse': {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
};
