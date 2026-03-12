/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        obsidian: {
          900: '#09090b', // Deepest background
          800: '#171717', // Elevate cards
          700: '#262626', // Hover states
          600: '#404040', // Borders, separators
        },
        industrial: {
          400: '#a1a1aa', // Secondary text
          300: '#d4d4d8', // Primary text
          50: '#fafafa',  // Brightest hits
        },
        electric: {
          500: '#0066FF', // Primary action
          600: '#0052cc', // Hover action
        },
        steelgold: {
          500: '#C9A84C', // Accent / Warning / Premium tier
          600: '#a68b3e',
        }
      },
      borderRadius: {
        'sm': '1px',
        DEFAULT: '2px',
        'md': '4px',
        'lg': '4px',
        'xl': '6px',
        '2xl': '8px',
        '3xl': '8px',
        'full': '9999px',
      }
    },
  },
  plugins: [],
}
