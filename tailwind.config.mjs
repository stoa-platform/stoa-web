/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,ts}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)', ink: 'var(--ink)', muted: 'var(--muted)',
        line: 'var(--line)', accent: 'var(--accent)', surface: 'var(--surface)',
      },
      fontFamily: { sans: ['var(--sans)'], serif: ['var(--serif)'], mono: ['var(--mono)'] },
    },
  },
  // The layout container is defined by the shared base.css.
  corePlugins: { container: false },
  plugins: [],
};
