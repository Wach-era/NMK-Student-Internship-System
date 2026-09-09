// frontend/tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nmk: {
          red: {
            50: '#FDF2F2',
            100: '#FDE8E8',
            200: '#FBD5D5',
            300: '#F8B4B4',
            400: '#F27A7A',
            500: '#E53E3E',
            600: '#C53030',
            700: '#9B2C2C',
            800: '#8B0000',
            900: '#660000',
          },
          gold: {
            50: '#FDF8F0',
            100: '#FCF0DD',
            200: '#F9E1BB',
            300: '#F5D29A',
            400: '#F2C378',
            500: '#D4AF37',
            600: '#B8960F',
            700: '#9C7D0A',
            800: '#806406',
            900: '#644B04',
          },
          cream: '#FDF5E6',
          brown: '#5D4037',
        }
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'nmk-gradient': 'linear-gradient(135deg, #8B0000 0%, #660000 100%)',
        'nmk-gradient-light': 'linear-gradient(135deg, #A52A2A 0%, #8B0000 100%)',
        'nmk-gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #B8960F 100%)',
      },
      boxShadow: {
        'nmk': '0 4px 6px rgba(139, 0, 0, 0.1)',
        'nmk-lg': '0 10px 15px rgba(139, 0, 0, 0.2)',
        'nmk-xl': '0 20px 25px rgba(139, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
}