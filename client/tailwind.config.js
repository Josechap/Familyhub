/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pastel Precision Palette
        'pastel-blue': '#A7C7E7',
        'pastel-pink': '#F4C2C2',
        'pastel-green': '#C1E1C1',
        'pastel-yellow': '#FDFD96',
        'pastel-purple': '#C3B1E1',
        'editorial-text': '#2C3E50', // Dark slate for high contrast
        'editorial-bg': '#F9F9F9',   // Soft white
      },
      fontFamily: {
        serif: ['Merriweather', 'serif'], // Editorial feel
        sans: ['Inter', 'sans-serif'],    // Clean UI
      },
    },
  },
  plugins: [],
}
