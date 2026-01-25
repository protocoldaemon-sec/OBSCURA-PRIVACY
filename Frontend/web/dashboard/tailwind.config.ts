import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#000000',
          secondary: '#0A0A0F',
          tertiary: '#121218',
          card: '#0D0D12',
        },
        brand: {
          primary: '#892CDC',    // Purple
          secondary: '#52057B',  // Dark Purple
          accent: '#BC6FF1',     // Light Purple/Pink
          dark: '#52057B',
        },
        border: {
          default: '#1A1A24',
          focus: '#892CDC',
        },
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(137, 44, 220, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(137, 44, 220, 0.6)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #52057B 0%, #892CDC 50%, #BC6FF1 100%)',
      },
    },
  },
  plugins: [],
}

export default config
