/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF4B2B', // Vermelho mais vibrante
          hover: '#FF3111', // Vermelho mais escuro para hover
        },
        secondary: {
          DEFAULT: '#2B2B2B', // Cinza escuro
          light: '#F3F4F6', // Cinza claro para backgrounds
        }
      }
    },
  },
  plugins: [],
} 