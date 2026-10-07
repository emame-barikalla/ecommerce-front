import type { Config } from 'tailwindcss';

/**
 * Every colour here maps to a token in `app/globals.css`. Adding a raw hex to
 * a component is a design-system bug — extend the token set instead.
 */
const config: Config = {
  // Toggled by the theme boot script / ThemeToggle on <html>.
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: 'rgb(var(--ink-rgb) / <alpha-value>)',
          secondary: 'rgb(var(--ink-secondary-rgb) / <alpha-value>)',
          tertiary: 'rgb(var(--ink-tertiary-rgb) / <alpha-value>)',
          inverse: 'rgb(var(--ink-inverse-rgb) / <alpha-value>)',
        },
        brand: {
          DEFAULT: 'rgb(var(--brand-rgb) / <alpha-value>)',
          hover: 'rgb(var(--brand-hover-rgb) / <alpha-value>)',
          subtle: 'rgb(var(--brand-subtle-rgb) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)',
          subtle: 'rgb(var(--accent-subtle-rgb) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'rgb(var(--border-rgb) / <alpha-value>)',
          strong: 'rgb(var(--border-strong-rgb) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'rgb(var(--surface-rgb) / <alpha-value>)',
          subtle: 'rgb(var(--bg-subtle-rgb) / <alpha-value>)',
          sunken: 'rgb(var(--bg-sunken-rgb) / <alpha-value>)',
          inverse: 'rgb(var(--surface-inverse-rgb) / <alpha-value>)',
        },
        success: { DEFAULT: 'rgb(var(--success-rgb) / <alpha-value>)', subtle: 'rgb(var(--success-subtle-rgb) / <alpha-value>)' },
        error: { DEFAULT: 'rgb(var(--error-rgb) / <alpha-value>)', subtle: 'rgb(var(--error-subtle-rgb) / <alpha-value>)' },
        sale: 'rgb(var(--sale-rgb) / <alpha-value>)',
        whatsapp: { DEFAULT: 'rgb(var(--whatsapp-rgb) / <alpha-value>)', hover: 'rgb(var(--whatsapp-hover-rgb) / <alpha-value>)' },
        background: 'rgb(var(--bg-rgb) / <alpha-value>)',
        /** Image scrims and modal backdrops — dark in both themes. */
        scrim: 'rgb(var(--scrim-rgb) / <alpha-value>)',
        foreground: 'rgb(var(--ink-rgb) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'Georgia', 'serif'],
        arabic: ['var(--font-arabic)', 'system-ui', 'sans-serif'],
        'arabic-display': ['var(--font-arabic-display)', 'var(--font-arabic)', 'serif'],
      },
      /**
       * UI text scale. `caption` (12px) is the floor for readable text;
       * `micro` exists only for numeric counters inside badges.
       */
      fontSize: {
        micro: ['0.625rem', { lineHeight: '1' }],
        caption: ['0.75rem', { lineHeight: '1.5' }],
        small: ['0.8125rem', { lineHeight: '1.55' }],
        body: ['0.9375rem', { lineHeight: '1.65' }],
      },
      borderColor: {
        DEFAULT: 'rgb(var(--border-rgb) / <alpha-value>)',
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        md: 'var(--radius)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        overlay: 'var(--shadow-overlay)',
      },
      spacing: {
        header: 'var(--header-h)',
        'bottom-nav': 'var(--bottom-nav-h)',
        section: '5rem',
        'section-lg': '7rem',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      zIndex: {
        header: '50',
        'bottom-nav': '55',
        overlay: '60',
        drawer: '70',
        toast: '80',
      },
      aspectRatio: {
        product: '3 / 4',
        editorial: '4 / 5',
      },
    },
  },
  plugins: [],
};

export default config;
