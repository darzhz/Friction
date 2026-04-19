/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bauhaus-red': '#D02020',
        'bauhaus-blue': '#1040C0',
        'bauhaus-yellow': '#F0C020',
        'bauhaus-black': '#121212',
        'bauhaus-white': '#F0F0F0',
        'bauhaus-muted': '#E0E0E0',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'bauhaus-sm': '4px 4px 0px 0px #121212',
        'bauhaus-md': '6px 6px 0px 0px #121212',
        'bauhaus-lg': '8px 8px 0px 0px #121212',
      },
      borderWidth: {
        '3': '3px',
        '4': '4px',
      },
    },
  },
  plugins: [],
}
