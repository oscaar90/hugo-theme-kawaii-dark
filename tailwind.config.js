const path = require('path')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    path.join(__dirname, 'layouts/**/*.html'),
    path.join(__dirname, 'content/**/*.md'),
    path.join(__dirname, 'exampleSite/**/*.html'),
    path.join(__dirname, 'exampleSite/**/*.md'),
  ],
  theme: {
    extend: {
      colors: {
        // Base — fondo slate oscuro, no negro puro
        void:    '#0d1117',   // fondo principal
        surface: '#161b22',   // cards, superficies elevadas
        smoke:   '#cdd9e5',   // texto principal (blanco frío)
        muted:   '#545d68',   // texto secundario/meta

        // Accents — azules suaves
        blue:   '#60a5fa',   // acento principal (blue-400)
        violet: '#93c5fd',   // acento secundario, tags (blue-300)
        mint:   '#4ade80',   // código, success, terminal
        amber:  '#fbbf24',   // warnings, callouts
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  safelist: [
    'text-blue/50', 'bg-blue/5', 'bg-blue/10',
    'border-blue/10', 'border-blue/30', 'border-blue/40',
    'hover:text-blue', 'hover:bg-blue/10', 'hover:border-blue/30',
    'text-blue', 'bg-blue/5',
  ],
  plugins: [],
}
