import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: { 50: "#EEF4EF", 100: "#D5E4D8", 200: "#A9C8B0", 500: "#3F7652", 600: "#2F6142", 700: "#264F36", 800: "#1E3F2B", 900: "#162E20" },
        leaf: { 50: "#F3F8EE", 100: "#E4F0D8", 200: "#CBE2B4", 300: "#A9CD88", 400: "#8DBB66" },
        cream: { 50: "#FFFDF8", 100: "#FBF7EE", 200: "#F4EDDD", 300: "#E9DEC6" },
        accent: { 50: "#FFF3EA", 100: "#FFE2CC", 400: "#F59A55", 500: "#EA7A2E", 600: "#D0661E", 700: "#AD5216" },
        ink: { 400: "#7A807C", 500: "#5C625E", 600: "#454A47", 700: "#323633", 900: "#1A1D1B" },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', "system-ui", "sans-serif"],
        display: ['"Fraunces Variable"', "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(22,46,32,0.04), 0 8px 24px -12px rgba(22,46,32,0.12)",
        lift: "0 2px 4px rgba(22,46,32,0.06), 0 18px 40px -18px rgba(22,46,32,0.28)",
      },
      borderRadius: { "4xl": "2rem" },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: { "fade-up": "fade-up .45s ease-out both", shimmer: "shimmer 1.4s infinite" },
    },
  },
  plugins: [],
};
export default config;
