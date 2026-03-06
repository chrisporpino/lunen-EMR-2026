/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: '#F7F9F9',
        primary: {
          DEFAULT: '#3A7D7C',
          light: '#4a9190',
          dark: '#2d6160',
        },
        accent: '#5BC0BE',
        danger: '#E63946',
        warning: '#F4A261',
        success: '#2DC653',
        surface: '#FFFFFF',
        muted: '#8A9BA8',
        border: '#E2EAEC',
      },
      borderRadius: {
        'card': '16px',
        'pill': '999px',
      },
      boxShadow: {
        'card': '0 2px 12px rgba(58,125,124,0.07)',
        'card-hover': '0 4px 20px rgba(58,125,124,0.13)',
      },
    },
  },
  plugins: [],
}
