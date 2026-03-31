import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        md: '2rem',
      },
    },
    extend: {
      colors: {
        brand: {
          50:  '#e8f5ee',
          100: '#c5e8d4',
          200: '#8fd4b0',
          400: '#2ea865',
          500: '#1a8a50',
          600: '#156e3f',
          700: '#0f5230',
          900: '#07200f',
        },
        accent: {
          50:  '#fef8ee',
          100: '#fdefd5',
          400: '#f5a623',
          500: '#e8950f',
          700: '#b86a07',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Bricolage Grotesque', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.06), 0 8px 24px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
}

export default config
