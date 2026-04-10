import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [],
  theme: {
    extend: {
      colors: {
        ink: {
          orange: 'var(--ink-orange)',
          coral: 'var(--ink-coral)',
          peach: 'var(--ink-peach)',
          pink: 'var(--ink-pink)',
          cream: 'var(--ink-cream)',
          'warm-gray': '#F7F0EB',
          'dark': '#1A1A2E',
          'dark-soft': '#2D2D44',
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
      backdropBlur: {
        '2xl': '40px',
        '3xl': '64px',
      },
      boxShadow: {
        'glass': '0 8px 32px color-mix(in srgb, var(--ink-orange) 10%, transparent)',
        'glass-lg': '0 16px 48px color-mix(in srgb, var(--ink-orange) 15%, transparent)',
        'glass-inset': 'inset 0 1px 1px rgba(255, 255, 255, 0.3)',
        'warm': '0 4px 24px color-mix(in srgb, var(--ink-orange) 20%, transparent)',
        'warm-lg': '0 8px 40px color-mix(in srgb, var(--ink-orange) 25%, transparent)',
      },
      animation: {
        'blob': 'blob 7s infinite',
        'blob-slow': 'blob 10s infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
  future: {
    respectDefaultRingColorOpacity: true,
  },
}

export default config
