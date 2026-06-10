/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'ocean-teal': '#008080',
        'deep-teal': '#005555',
        'dark-teal-text': '#003333',
        'coral': '#FF7F50',
        'golden': '#FFC857',
        'soft-cream': '#FFFDF7',
        'dark-text': '#2A1A10',
        'light-text': '#FFFFFF',
        'muted-text': '#888888',
        'border-light': '#E8E0D0',
        'overlay-bg': '#008080',
        'success-green': '#4CAF50',
        'error-red': '#FF5252',
        'correct-glow': '#A4E5A4',
        'wrong-glow': '#FFB0B0',
        'blush': '#FFF0E0',
        'mint': '#DFFFE0',
        'lavender-pale': '#E8E0FF',
        'lemon': '#FFF9C4',
        'sky-pale': '#D0EFFF',
        'peach': '#FFE4D0',
        'frost': '#E0F5FF',
        'sage': '#E0FFE0',
        'sands': '#FFF3E0',
        'petal': '#FFE0E8',
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
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
      fontFamily: {
        'display': ['"Fredoka One"', 'cursive'],
        'body': ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        'card': '0 4px 20px rgba(0, 128, 128, 0.08)',
        'card-hover': '0 12px 40px rgba(0, 128, 128, 0.15)',
        'button': '0 4px 12px rgba(255, 127, 80, 0.3)',
        'button-hover': '0 8px 24px rgba(255, 127, 80, 0.4)',
        'glow-correct': '0 0 20px rgba(76, 175, 80, 0.5)',
        'glow-wrong': '0 0 20px rgba(255, 82, 82, 0.3)',
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
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(255, 127, 80, 0.4)" },
          "100%": { boxShadow: "0 0 0 12px rgba(255, 127, 80, 0)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(-10px)" },
          "50%": { transform: "translateY(10px)" },
        },
        "cloud-drift": {
          "0%, 100%": { transform: "translateX(-20px)" },
          "50%": { transform: "translateX(20px)" },
        },
        "wave-sway": {
          "0%, 100%": { transform: "translateX(-5px)" },
          "50%": { transform: "translateX(5px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "pulse-ring": "pulse-ring 2s ease-out infinite",
        "float": "float 4s ease-in-out infinite",
        "cloud-drift": "cloud-drift 20s ease-in-out infinite",
        "wave-sway": "wave-sway 6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
