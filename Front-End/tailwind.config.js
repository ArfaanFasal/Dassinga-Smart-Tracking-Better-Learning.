/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          950: '#1e1b4b',
        },
        /** Dassinga brand (logo) */
        dassinga: {
          navy: '#1A365D',
          green: '#2F855A',
          blue: '#2B6CB0',
          gold: '#ECC94B',
        },
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(15, 23, 42, 0.08)',
        'soft-lg': '0 12px 40px -8px rgba(15, 23, 42, 0.12)',
      },
    },
  },
  plugins: [],
};
