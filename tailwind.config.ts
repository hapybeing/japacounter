import type { Config } from 'tailwindcss';
export default {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: { extend: { colors: { bg: '#050505', panel: '#101010', gold: '#C8A96D' } } },
  plugins: []
} satisfies Config;
