/** @type {import('tailwindcss').Config} */
// Tayfa design tokens — warm, social, premium. Kept in sync with
// src/design-system/tokens.ts (that file is the typed mirror for RN inline use).
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Surfaces — warm whites and sand, never clinical grey.
        canvas: '#FFFBF7',
        surface: '#FFFFFF',
        'surface-alt': '#F7F2EB',
        'surface-sunken': '#F0E8DD',
        line: '#ECE3D7',
        'line-strong': '#DfD3C4',
        // Ink — warm near-black for trust + legibility.
        ink: '#1F1A17',
        'ink-muted': '#5B524B',
        'ink-subtle': '#94897E',
        'ink-inverse': '#FFFBF7',
        // Ember — the social, energetic primary.
        ember: '#FF5A3C',
        'ember-dark': '#E8431F',
        'ember-soft': '#FFE7E0',
        // Amber — warmth / streaks / highlights.
        amber: '#FF9F1C',
        'amber-soft': '#FFF1D8',
        // Grape — premium (Tayfa+) accent.
        grape: '#7A5AF8',
        'grape-soft': '#EDE9FE',
        // Verified — trust teal.
        verified: '#0E9F8E',
        'verified-soft': '#D7F2EE',
        // Status.
        success: '#1EA672',
        'success-soft': '#DCF3E8',
        danger: '#E5484D',
        'danger-soft': '#FCE5E6',
        // Women-only safety filter.
        women: '#C24AAE',
        'women-soft': '#FBE6F4',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '22px',
        '2xl': '28px',
      },
      fontFamily: {
        // System stack — swap to a brand face via expo-font without touching screens.
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
