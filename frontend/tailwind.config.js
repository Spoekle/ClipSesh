/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cc-blue': '#00aeef',
        'cc-red': '#ee283b',
        'blurple': '#5539cc',
        'blurple-dark': '#38248e',
      },
    },
  },
  plugins: [
    require('tailwindcss-animated')
  ],
}