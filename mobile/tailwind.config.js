/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#9FE870',
          dark: '#8ed85f',
          light: '#b5f08f',
        },
        surface: {
          page: '#F8FAFC',
          card: '#FFFFFF',
        },
        text: {
          primary: '#0F172A',
          muted: '#64748B',
        },
        border: '#E2E8F0',
        error: '#EF4444',
        success: '#22C55E',
      },
      fontFamily: {
        display: ['Inter-Bold', 'sans-serif'],
        body: ['Inter-Regular', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
