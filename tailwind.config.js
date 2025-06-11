/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Changed from "./**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#4A90E2', // A nice blue
          light: '#7BB9F3',
          dark: '#2E69A4',
        },
        secondary: {
          DEFAULT: '#50E3C2', // A teal/mint
        },
        accent: {
          DEFAULT: '#F5A623', // An orange
        }
      }
    },
  },
  plugins: [],
}