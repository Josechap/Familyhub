/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Modern Family Dashboard Palette
        'primary': '#6366F1',        // Indigo - main accent
        'primary-dark': '#4F46E5',
        'success': '#10B981',        // Emerald
        'warning': '#F59E0B',        // Amber
        'danger': '#EF4444',         // Red

        // Dark mode colors
        'dark-bg': '#0F0F0F',
        'dark-card': '#1A1A1A',
        'dark-border': '#2A2A2A',

        // Light mode colors
        'light-bg': '#F8FAFC',
        'light-card': '#FFFFFF',

        // Family member colors (vibrant)
        'family-blue': '#3B82F6',
        'family-pink': '#EC4899',
        'family-green': '#22C55E',
        'family-purple': '#A855F7',
        'family-orange': '#F97316',
        'family-cyan': '#06B6D4',

        // Legacy (keeping for compatibility)
        'pastel-blue': '#A7C7E7',
        'pastel-pink': '#F4C2C2',
        'pastel-green': '#C1E1C1',
        'pastel-yellow': '#FDFD96',
        'pastel-purple': '#C3B1E1',
        'editorial-text': '#1E293B',
        'editorial-bg': '#F8FAFC',
      },
      fontFamily: {
        display: ['SF Pro Display', 'Inter', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'hero': ['4.5rem', { lineHeight: '1', fontWeight: '700' }],
        'display': ['3rem', { lineHeight: '1.1', fontWeight: '600' }],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(99, 102, 241, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'check': 'check 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        check: {
          '0%': { transform: 'scale(0)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
