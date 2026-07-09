// stack_sandbox/frontend_web/tailwind.config.js
/** @type {import('tailwindcss').Config} */

const STONE_SHADES = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];

const stoneColors = Object.fromEntries(
  STONE_SHADES.map((shade) => [shade, `rgb(var(--stone-${shade}) / <alpha-value>)`]),
);

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        stone: stoneColors,
        app: {
          DEFAULT: "rgb(var(--app-bg) / <alpha-value>)",
          canvas: "rgb(var(--app-canvas-bg) / <alpha-value>)",
          accent: {
            DEFAULT: "rgb(var(--app-accent) / <alpha-value>)",
            muted: "rgb(var(--app-accent-muted) / <alpha-value>)",
            on: "rgb(var(--app-accent-on) / <alpha-value>)",
          },
        },
      },
      borderRadius: {
        "app-sm": "var(--app-radius-sm)",
        "app-md": "var(--app-radius-md)",
        "app-lg": "var(--app-radius-lg)",
        "app-xl": "var(--app-radius-xl)",
      },
      boxShadow: {
        "app-panel": "var(--app-shadow-panel)",
        "app-float": "var(--app-shadow-float)",
        "app-inset": "var(--app-shadow-inset)",
      },
      keyframes: {
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-out-right": {
          "0%": { transform: "translateX(0)", opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0" },
        },
      },
      animation: {
        "slide-in-right": "slide-in-right 0.3s ease-out forwards",
        "slide-out-right": "slide-out-right 0.3s ease-out forwards",
      },
    },
  },
  plugins: [],
};
