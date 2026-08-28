/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    fontFamily: {
      sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    extend: {
      colors: {
        border: "var(--border)",
        'border-subtle': "var(--border-subtle)",
        'border-card': "var(--border-card)",
        input: "var(--border)",
        ring: "var(--accent)",
        bg: "var(--bg)",
        'bg-subtle': "var(--bg-subtle)",
        'sidebar-bg': "var(--sidebar-bg)",
        surface: "var(--surface)",
        'surface-elevated': "var(--surface-elevated)",
        'surface-hover': "var(--surface-hover)",
        'surface-deep': "var(--surface-deep)",
        'text-primary': "var(--text-primary)",
        'text-secondary': "var(--text-secondary)",
        'text-muted': "var(--text-muted)",
        'text-inverse': "var(--text-inverse)",
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          soft: "var(--accent-soft)",
          muted: "var(--accent-muted)",
          foreground: "var(--accent-foreground)",
        },
        primary: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        secondary: {
          DEFAULT: "var(--surface-elevated)",
          foreground: "var(--text-primary)",
        },
        muted: {
          DEFAULT: "var(--surface-elevated)",
          foreground: "var(--text-muted)",
        },
        success: {
          DEFAULT: "var(--success)",
          muted: "var(--success-muted)",
          foreground: "#ffffff",
        },
        warning: {
          DEFAULT: "var(--warning)",
          muted: "var(--warning-muted)",
          foreground: "#ffffff",
        },
        danger: {
          DEFAULT: "var(--danger)",
          muted: "var(--danger-muted)",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "var(--danger)",
          foreground: "#ffffff",
        },
        info: {
          DEFAULT: "var(--info)",
          muted: "var(--info-muted)",
        },
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
        xl: "var(--radius-xl)",
        '2xl': "var(--radius-2xl)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
}
