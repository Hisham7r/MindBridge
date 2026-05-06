/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#1A56DB',
          700: '#1E40AF',
          800: '#1E3A8A',
          900: '#172554',
        },
        brand: '#1A56DB',
        bg: '#F0F4F8',
        surface: '#FFFFFF',
        success: '#22C55E',
        danger: '#EF4444',
        warning: '#F59E0B',
        muted: '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
