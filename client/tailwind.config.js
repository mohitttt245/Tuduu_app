/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        ink: '#172138',
        muted: '#7c8498',
        canvas: '#f6f7fb',
        violet: { 50: '#f1efff', 100: '#e5e1ff', 500: '#7465e8', 600: '#6655dc', 700: '#5444c5' },
      },
      boxShadow: { panel: '0 10px 35px rgba(30, 42, 75, .055)' },
    },
  },
  plugins: [],
};
