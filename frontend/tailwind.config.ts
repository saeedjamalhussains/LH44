import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Named `noir`, not `base`: a colour called `base` would generate a
        // `text-base` utility that collides with Tailwind's font-size utility.
        noir: '#050505',
        surface: '#0B0B0B',
        panel: '#111111',
        line: '#222222',
        ink: '#F4F4F4',
        muted: '#8A8A8A',
        tech: '#B8B8B8',
        gold: { DEFAULT: '#C9A227', bright: '#E8C767', dim: '#6B5613' },
        silver: { DEFAULT: '#9BA1A6', dim: '#3A3F44' },
        ferrari: { DEFAULT: '#D40000', bright: '#FF2B1F', dim: '#4A0505' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Oswald', 'Impact', 'sans-serif'],
        ui: ['var(--font-ui)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: { widest2: '0.28em' },
      screens: { xl2: '1440px' },
    },
  },
  plugins: [],
};
export default config;
