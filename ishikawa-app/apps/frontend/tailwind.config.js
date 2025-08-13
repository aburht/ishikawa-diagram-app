/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/components/**/*.{js,ts,jsx,tsx}', // Scan components in src/app/components
    './src/app/**/*.{js,ts,jsx,tsx}', // Scan other files in src/app
    './src/**/*.{js,ts,jsx,tsx}', // Scan all in src for safety
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};