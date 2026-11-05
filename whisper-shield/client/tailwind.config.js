/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Japanese Indigo (Primary brand identity)
        brand: {
          DEFAULT: '#285C70',
          primary: '#285C70',
          deep: '#1C3E4E',
          dark: '#193746',
          darkest: '#16303D',
          medium: '#255468',
          light: '#224D5F',
          accent: '#60899B',
          highlight: '#6C9BAD',
        },
        // Charcoal (Dark mode surfaces)
        charcoal: {
          900: '#000000',
          850: '#090909',
          800: '#111111',
          700: '#232323',
          600: '#2C2C2C',
          500: '#353535',
        },
        // Japanese Indigo
        jpindigo: {
          900: '#16303D',
          800: '#193746',
          700: '#1C3E4E',
          600: '#224D5F',
          500: '#255468',
          400: '#285C70',
        },
        // Steel Teal
        steelteal: {
          700: '#3F5A66',
          600: '#486675',
          500: '#517380',
          400: '#60899B',
          300: '#6692A4',
          200: '#6C9BAD',
        },
        // Mid Grey
        midgrey: {
          700: '#757575',
          600: '#7E7E7E',
          500: '#808080',
          400: '#989898',
          300: '#A1A1A1',
          200: '#AAAAAA',
        },
        // Foggy
        foggy: {
          700: '#9E9C8A',
          600: '#A8A692',
          500: '#B1AF9A',
          400: '#C4C2AA',
          300: '#CDCAB2',
          200: '#D6D3BA',
        },
        // Star Dust (Light mode canvas & cards)
        stardust: {
          500: '#CECAC8',
          400: '#D8D3D1',
          300: '#E2DDDA',
          200: '#F2EDEA',
          100: '#F9F3F1',
          50: '#FFFAF8',
        },
        surface: {
          base: '#090909',
          panel: '#111111',
          card: '#16191c',
          hover: '#1d2227',
          active: '#232a30',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.08)',
          focus: 'rgba(96, 137, 155, 0.45)',
          strong: 'rgba(255, 255, 255, 0.16)',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Geist Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      boxShadow: {
        'card-light': '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
        'card-studio': '0 10px 32px -4px rgba(15, 23, 42, 0.06), 0 4px 12px -2px rgba(15, 23, 42, 0.03)',
        'card-hover': '0 18px 40px -6px rgba(15, 23, 42, 0.1), 0 6px 16px -2px rgba(15, 23, 42, 0.05)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.3)',
        'glow-indigo': '0 0 25px -5px rgba(99, 102, 241, 0.3)',
        'liquid': '0 8px 24px -4px rgba(15, 23, 42, 0.18), 0 3px 8px -2px rgba(15, 23, 42, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
        'liquid-hover': '0 14px 32px -4px rgba(15, 23, 42, 0.26), 0 6px 12px -2px rgba(15, 23, 42, 0.15)',
        'liquid-emerald': '0 8px 25px -3px rgba(16, 185, 129, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.45)',
        'liquid-indigo': '0 8px 25px -3px rgba(99, 102, 241, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.45)',
        'liquid-amber': '0 8px 25px -3px rgba(245, 158, 11, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.45)',
      }
    },
  },
  plugins: [],
}
