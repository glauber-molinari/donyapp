import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        /** Canvas principal (#F0F4F3) — PRODUCT */
        app: {
          canvas: "#F0F4F3",
          sidebar: "#FFFFFF",
          /** violet-400 — primária, sem saturar */
          primary: "#A78BFA",
          border: "#E5E7EB",
        },
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
      spacing: {
        /** Gaps recomendados 16–24px */
        section: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
