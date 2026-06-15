/** @type {import('tailwindcss').Config} */
module.exports = {
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

        /** Design system — tokens canônicos (fonte da verdade: DESIGN_SYSTEM.md) */
        ds: {
          // ── Marca ──────────────────────────────────────
          cream:          "#f5f2ef",   // canvas — nunca branco puro
          "cream-50":     "#fbfaf8",   // documentação, fundos mais suaves
          ink:            "#0c0a09",   // texto principal
          "ink-2":        "#2a2622",   // texto secundário
          accent:         "#ff5500",   // UMA por tela: CTA ou etapa ativa ou prazo crítico
          "accent-soft":  "#ffeee4",   // fundo suave para accent

          // ── Sinal funcional ────────────────────────────
          success:        "#1f8a5b",   // entregue
          "success-soft": "#e2f3ea",
          warn:           "#b97700",   // prazo próximo (≤5d)
          "warn-soft":    "#fbeeda",
          danger:         "#c43838",   // atrasado / ação destrutiva
          "danger-soft":  "#fbe3e3",
          info:           "#2a6fdb",   // informação neutra
          "info-soft":    "#e3edfb",

          // ── Neutros ────────────────────────────────────
          muted:          "#6b6660",   // texto terciário, metadados
          "muted-2":      "#908a83",   // placeholders visuais, labels uppercase
          "border-strong":"#d4ccc0",   // bordas em cards sobre superfícies elevadas
          border:         "#e3ddd4",   // bordas padrão
          hairline:       "#ece8e1",   // divisórias leves, separadores
          surface:        "#ffffff",   // cards, modais — não o canvas

          // ── Legado (não remover — código existente usa) ─
          "accent-ink":   "#b45309",   // texto accent sobre fundo claro (WCAG)
          subtle:         "#5c534d",   // alias legado de muted
          elevated:       "#ede8e3",   // sidebar mocks, superfícies levantadas
          "elevated-soft":"#e0dbd6",   // skeletons
          "on-dark":      "#fafaf9",   // texto sobre fundo ink
        },

        /** Aliases legados `app.*` — mantidos para código existente */
        app: {
          canvas:  "#f5f2ef",
          sidebar: "#ffffff",
          primary: "#ff5500",
          border:  "#e3ddd4",   // alinhado com ds-border
        },
      },

      boxShadow: {
        // ── DS canônico (4 alturas, todas baixas) ──────────────────────────────
        "ds-sm":  "0 1px 2px rgba(12,10,9,0.04)",
        "ds-md":  "0 4px 12px rgba(12,10,9,0.06), 0 1px 2px rgba(12,10,9,0.04)",
        "ds-lg":  "0 12px 32px rgba(12,10,9,0.08), 0 2px 6px rgba(12,10,9,0.04)",
        "ds-pop": "0 24px 60px rgba(12,10,9,0.14), 0 4px 12px rgba(12,10,9,0.06)",
        // ── Legado (mantido enquanto houver referências) ───────────────────────
        "ds-card":"0 4px 40px rgba(12,10,9,0.06)",
      },

      borderRadius: {
        // ── DS canônico (4/6/8/12/14/999) ─────────────────────────────────────
        "ds-sm":   "4px",    // tags inline, dot indicators
        "ds-md":   "6px",    // badges, chips pequenos
        "ds-lg":   "8px",    // botões, inputs, selects (padrão de controle)
        "ds-xl":   "12px",   // tooltips, dropdowns, cards menores
        "ds-card": "14px",   // cards de job, painéis, modais menores
        "ds-2xl":  "18px",   // modais, drawers
        "ds-pill": "999px",  // badges de prazo, tags pill
        // ── Legado (mantido para landing e código existente) ──────────────────
        // rounded-ds-xl era 1rem (16px); agora é 12px — ajustado no PR 1
        // rounded-ds-card era 2rem (32px); agora é 14px — ajustado no PR 1
        // rounded-ds-2xl era 1.25rem (20px); agora é 18px — ajustado no PR 1
      },

      transitionDuration: {
        "ds-fast":  "120ms",  // hover, focus
        "ds-modal": "180ms",  // modais, drawers
        // legado — manter enquanto houver uso de `duration-ds`
        ds:         "150ms",
      },

      spacing: {
        section:          "1.25rem",
        "touch-target":   "2.75rem",  // 44px — WCAG 2.1 mínimo
        "mobile-padding": "max(1rem, env(safe-area-inset-left, 0px))",
      },

      screens: {
        "tablet-landscape": { raw: "(min-width: 768px) and (orientation: landscape)" },
      },
    },
  },
  plugins: [
    require("@tailwindcss/container-queries"),
    require("@tailwindcss/typography"),
  ],
};
