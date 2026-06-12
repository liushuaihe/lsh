/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'spectrum-bg': '#0a1628',
        'spectrum-panel': '#0f2040',
        'spectrum-card': '#152a52',
        'spectrum-border': '#1e3a6b',
        'spectrum-primary': '#3b82f6',
        'spectrum-accent': '#06b6d4',
        'spectrum-purple': '#8b5cf6',
        'spectrum-green': '#10b981',
        'spectrum-text': '#e2e8f0',
        'spectrum-muted': '#64748b',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px)",
        'spectrum-gradient': 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 35%, #06b6d4 70%, #10b981 100%)',
        'glow-radial': 'radial-gradient(circle at 50% 0%, rgba(59,130,246,0.15), transparent 60%)',
      },
      backgroundSize: {
        'grid-size': '28px 28px',
      },
      boxShadow: {
        'glow': '0 0 30px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
        'card': '0 4px 24px rgba(0,0,0,0.35)',
        'inner-glow': 'inset 0 0 20px rgba(6,182,212,0.08)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'flow': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'flow': 'flow 8s ease infinite',
      },
    },
  },
  plugins: [],
};
