/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#6C3FCF', light: '#8B5CF6', dark: '#4C1D95' },
        accent: { DEFAULT: '#F97316', light: '#FB923C' },
        surface: '#F9FAFB',
        card: '#FFFFFF',
      },
      fontSize: {
        headingLg: ['1.75rem', { lineHeight: '2.25rem', fontWeight: '600' }],
        headingMd: ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        body: ['0.9375rem', { lineHeight: '1.6', fontWeight: '400' }],
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};