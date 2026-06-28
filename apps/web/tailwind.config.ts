import type { Config } from 'tailwindcss';

/**
 * Tayfa design tokens. The brand reads "warm, verified, real-life" — not the cold
 * neon of dating apps. A deep ink base, a confident coral ("tayfa" = crew/squad),
 * and a trust-teal accent for safety surfaces. Type pairs a humanist sans for UI
 * with a tighter display weight for hero moments.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#15131f',
          soft: '#211d30',
          muted: '#3a3450',
        },
        coral: {
          DEFAULT: '#ff6a5b',
          deep: '#e8513f',
          soft: '#ffd9d2',
        },
        teal: {
          DEFAULT: '#1fb6a6',
          deep: '#0e8576',
        },
        sand: '#f7f3ee',
        cream: '#fffdfa',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'ui-sans-serif', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        lift: '0 24px 60px -28px rgba(21, 19, 31, 0.45)',
        card: '0 8px 30px -16px rgba(21, 19, 31, 0.25)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
