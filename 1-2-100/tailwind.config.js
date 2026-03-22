/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,js}',
    './game.js',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        secondary: '#818CF8',
        cta: '#F97316',
        background: '#EEF2FF',
        text: '#1E1B4B',
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        muted: '#94A3B8',
      },
      fontFamily: {
        heading: ['Fredoka', 'sans-serif'],
        body: ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        'game': '16px',
        'card': '20px',
        'button': '12px',
      },
      boxShadow: {
        'button': '0 4px 0 #EA580C, 0 8px 16px rgba(249, 115, 22, 0.3)',
        'button-hover': '0 6px 0 #EA580C, 0 12px 24px rgba(249, 115, 22, 0.4)',
        'card': '0 4px 6px rgba(79, 70, 229, 0.05), 0 10px 20px rgba(79, 70, 229, 0.1)',
        'card-hover': '0 8px 12px rgba(79, 70, 229, 0.1), 0 20px 40px rgba(79, 70, 229, 0.15)',
        'cell': '0 2px 8px rgba(79, 70, 229, 0.1)',
        'cell-hover': '0 4px 12px rgba(79, 70, 229, 0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.5s ease-in-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
