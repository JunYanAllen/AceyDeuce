import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        felt: '#1a472a',
        'felt-dark': '#133520',
        gold: '#FFD700',
      },
      keyframes: {
        fadeInScale: {
          '0%': { opacity: '0', transform: 'scale(0.75)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        flashRow: {
          '0%': { backgroundColor: 'rgba(255,215,0,0.25)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
      animation: {
        'fade-in-scale': 'fadeInScale 0.35s ease forwards',
        'flash-row': 'flashRow 1s ease forwards',
      },
    },
  },
  plugins: [],
};

export default config;
