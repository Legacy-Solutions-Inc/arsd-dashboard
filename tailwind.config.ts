import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
        xl: "2.5rem",
        "2xl": "3rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
      },
    },
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        arsd: {
          red: "hsl(var(--arsd-red))",
          "red-dark": "hsl(var(--arsd-red-hover))",
          gray: "hsl(var(--arsd-ink-secondary))",
          "gray-dark": "hsl(var(--arsd-ink))",
          paper: "hsl(var(--arsd-paper))",
          surface: "hsl(var(--arsd-surface))",
          ink: "hsl(var(--arsd-ink))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "10px",
        xl: "14px",
        "2xl": "18px",
      },
      fontSize: {
        "display-1": ["clamp(2.5rem, 4vw, 3.75rem)", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-2": ["clamp(2rem, 3vw, 2.75rem)", { lineHeight: "1.1", letterSpacing: "-0.015em", fontWeight: "700" }],
        "h1": ["1.875rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "700" }],
        "h2": ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.005em", fontWeight: "600" }],
        "h3": ["1.25rem", { lineHeight: "1.3", fontWeight: "600" }],
        "body-lg": ["1.0625rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body": ["0.9375rem", { lineHeight: "1.55", fontWeight: "400" }],
        "small": ["0.8125rem", { lineHeight: "1.5", fontWeight: "500" }],
        "caption": ["0.75rem", { lineHeight: "1.4", fontWeight: "500", letterSpacing: "0.06em" }],
      },
      boxShadow: {
        "xs": "0 1px 2px 0 rgb(48 40 28 / 0.04)",
        "sm-tinted": "0 1px 3px 0 rgb(48 40 28 / 0.06), 0 1px 2px -1px rgb(48 40 28 / 0.06)",
        "md-tinted": "0 4px 12px -2px rgb(48 40 28 / 0.08)",
        "lg-tinted": "0 12px 24px -6px rgb(48 40 28 / 0.10)",
        "red": "0 6px 20px -4px rgb(199 31 31 / 0.18)",
      },
      transitionTimingFunction: {
        "out-soft": "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
