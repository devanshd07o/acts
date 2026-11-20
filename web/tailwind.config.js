/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-canvas)',
        surface: 'var(--bg-surface)',
        card: 'var(--bg-card)',
        subtle: 'var(--bg-subtle)',
        border: {
          subtle: 'var(--border-subtle)',
          medium: 'var(--border-medium)',
          strong: 'var(--border-strong)',
        },
        primary: {
          DEFAULT: 'var(--accent-primary)',
          hover: 'var(--accent-hover)',
          surface: 'var(--accent-surface)',
        },
        acts: {
          teal: '#0d9488',
          admin: '#0f172a',
          citizen: '#0284c7',
          critical: '#dc2626',
          high: '#ea580c',
          medium: '#d97706',
          bg: '#f8fafc',
          mapBg: '#e2e8f0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'subtle': '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.08)',
        'command': '0 4px 20px -2px rgba(15, 23, 42, 0.2), 0 2px 6px -1px rgba(15, 23, 42, 0.1)',
      }
    },
  },
  plugins: [],
}
