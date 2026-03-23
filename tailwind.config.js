/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F19',
        surface: '#121826',
        'surface-soft': '#1A2234',
        foreground: '#F8FAFC',
        muted: '#94A3B8',
        brand: '#00E676',
        accent: '#FF5E5B',
        line: 'rgba(255, 255, 255, 0.06)'
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        display: ['"Oswald"', 'sans-serif']
      }
    },
  },
  plugins: [],
}
