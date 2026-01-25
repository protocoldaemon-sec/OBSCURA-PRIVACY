/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'obscura-primary': '#222831',
        'obscura-secondary': '#393E46',
        'obscura-accent': '#00ADB5',
        'obscura-text': '#EEEEEE',
      },
      fontFamily: {
        'aeonik': ['Aeonik Pro', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
        'manrope': ['Manrope', 'sans-serif'],
        'inter': ['Inter Display', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
