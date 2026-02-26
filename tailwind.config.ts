import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        display: ['var(--font-syne)', 'sans-serif'],
      },
      colors: {
        brand: {
          orange: '#e85d2f',
          ink: '#0d0d0d',
          paper: '#f5f0e8',
          cream: '#ede8de',
        },
        semaforo: {
          green: '#2d8a4e',
          'green-light': '#e8f5ec',
          yellow: '#d4920a',
          'yellow-light': '#fef8e7',
          red: '#c0392b',
          'red-light': '#fdecea',
        }
      }
    },
  },
  plugins: [],
}
export default config
