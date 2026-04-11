import type { Config } from "tailwindcss";

const config: Config = {
  /** Classes vindas do banco (`kanban_stages.color`) precisam existir no bundle */
  safelist: [
    "bg-ds-accent/10",
    "bg-amber-50",
    "bg-blue-50",
    "bg-green-50",
    "bg-pink-50",
    "bg-violet-50",
    "bg-cyan-50",
    "bg-orange-50",
    "bg-teal-50",
    "bg-sky-50",
    "bg-rose-50",
    "bg-lime-50",
    "bg-fuchsia-50",
    "bg-indigo-50",
  ],
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
        /** Design system — landing / app unificado */
        ds: {
          cream: "#f5f2ef",
          ink: "#0c0a09",
          accent: "#ff5500",
          /** Laranja mais escuro para texto sobre fundo claro (WCAG AA com #f5f2ef). Mantém #accent em botões. */
          "accent-ink": "#b45309",
          muted: "#57534e",
          /** Antes #78716c; escurecido para texto secundário pequeno no cream passar 4.5:1 */
          subtle: "#5c534d",
          border: "#e8e4df",
          "border-strong": "#ebe6e1",
          surface: "#ffffff",
          elevated: "#ede8e3",
          "elevated-soft": "#e0dbd6",
          "on-dark": "#fafaf9",
        },
        /** Aliases compatíveis com código que usa app-* */
        app: {
          canvas: "#f5f2ef",
          sidebar: "#ffffff",
          primary: "#ff5500",
          border: "#e8e4df",
        },
      },
      boxShadow: {
        "ds-sm": "0 4px 24px rgba(12, 10, 9, 0.06)",
        "ds-md": "0 8px 32px rgba(12, 10, 9, 0.1)",
        "ds-card": "0 4px 40px rgba(12, 10, 9, 0.06)",
      },
      borderRadius: {
        "ds-xl": "1rem",
        "ds-2xl": "1.25rem",
        "ds-card": "2rem",
      },
      transitionDuration: {
        ds: "150ms",
      },
      spacing: {
        section: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
