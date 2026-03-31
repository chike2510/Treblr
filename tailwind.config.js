/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        t: {
          bg:      '#07090f',
          surface: '#0d1119',
          card:    '#121820',
          border:  '#1c2535',
          accent:  '#8b5cf6',
          alt:     '#a78bfa',
          gold:    '#fbbf24',
          green:   '#34d399',
          red:     '#f87171',
          blue:    '#60a5fa',
          muted:   '#64748b',
          text:    '#e2e8f0',
          dim:     '#94a3b8'
        }
      },
      fontFamily: {
        display: ['"Syne"', 'system-ui', 'sans-serif'],
        body:    ['"Outfit"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace']
      },
      keyframes: {
        slideUp:  { from: { transform: 'translateY(16px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        pulse2:   { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } }
      },
      animation: {
        slideUp: 'slideUp 0.25s ease-out',
        fadeIn:  'fadeIn 0.3s ease-out',
        pulse2:  'pulse2 2s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
