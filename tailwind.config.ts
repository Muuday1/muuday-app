import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
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
    },
  },
  plugins: [],
}

export default config
