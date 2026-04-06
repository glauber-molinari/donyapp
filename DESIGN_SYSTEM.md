# Design system — Donyapp

Referência visual unificada, derivada da **landing page** (paleta quente iOS / editorial).  
Tokens expostas no **Tailwind** sob o prefixo `ds` (design system) e variáveis CSS em `app/globals.css`.

## Princípios

- **Fundo** sempre em tom creme, não branco puro na tela inteira.
- **Texto** quase preto (`ink`) para títulos e ações; cinzas quentes para secundário.
- **Acento** laranja saturado só em CTAs, links fortes e estados de ênfase — uso pontual.
- **Bordas** discretas, sombras leves com canal alpha no `ink`.
- **Cantos** generosos (`rounded-ds-xl`, `rounded-ds-card`) alinhados à marca.
- **Movimento** curto: `150ms`, `ease-out`.

## Cores (Tailwind)

| Token | Hex | Uso |
|--------|-----|-----|
| `ds-cream` | `#f5f2ef` | Canvas da app, fundos de página, hero |
| `ds-ink` | `#0c0a09` | Títulos, texto principal, sidebar ativa |
| `ds-accent` | `#ff5500` | Botão primário, links de destaque, badges de tipo “foto” |
| `ds-muted` | `#57534e` | Parágrafos, descrições |
| `ds-subtle` | `#78716c` | Metadados, placeholders visuais |
| `ds-border` | `#e8e4df` | Bordas padrão, divisórias |
| `ds-border-strong` | `#ebe6e1` | Bordas em cards sobre creme |
| `ds-surface` | `#ffffff` | Cards, painéis, sidebar |
| `ds-elevated` | `#ede8e3` | Sidebar interna de mocks, superfícies levantadas |
| `ds-elevated-soft` | `#e0dbd6` | Skeletons / placeholders |
| `ds-on-dark` | `#fafaf9` | Texto sobre fundo `ink` |

**Aliases legados `app.*`** (mesma paleta, para código existente): `app-canvas`, `app-primary`, `app-border`, `app-sidebar`.

Variáveis CSS: `--background`, `--foreground` espelham `cream` / `ink` para `body` e integrações futuras.

## Tipografia

- **Família:** `Inter` (via `--font-inter` no `RootLayout`).
- **Landing / marketing:** pesos **800–900** em headlines (`displayClassName` na landing).
- **App (UI):** `text-sm`–`text-base` para formulários; `font-semibold` / `font-bold` para títulos de tela (`text-2xl`).

## Espaçamento e layout

- Padding global do conteúdo autenticado: `p-6` no `<main>` do shell.
- Largura máxima de conteúdo marketing: `1200px` (`max-w-[1200px]`).
- Gaps entre blocos: `gap-4`–`gap-6`.

## Raio e sombras

| Classe | Valor |
|--------|--------|
| `rounded-ds-xl` | `1rem` |
| `rounded-ds-2xl` | `1.25rem` |
| `rounded-ds-card` | `2rem` |
| `shadow-ds-sm` | sombra curta para elevação leve |
| `shadow-ds-md` | sombra média (menus flutuantes) |
| `shadow-ds-card` | preview / cartões destacados |

## Componentes

- **Button:** `primary` = fundo `ds-accent`, texto branco; `secondary` = borda `ds-border`, fundo branco; `ghost` = hover `ds-cream`; `danger` inalterado (semântico).
- **Inputs / Select / Textarea:** borda `ds-border`, foco com anel `ds-accent/25`.
- **Card / Modal:** `ds-surface`, borda `ds-border`, `rounded-ds-xl`.
- **Estados de feedback:** sucesso / erro mantêm verde e vermelho acessíveis (não fazem parte do “accent” de marca).

## Onde está no código

- **Tokens Tailwind:** `tailwind.config.ts` → `theme.extend.colors.ds`, `boxShadow`, `borderRadius`.
- **Base global:** `app/globals.css` → `:root`.
- **Referência de uso:** `components/marketing/landing-page.tsx`.

Ao criar telas novas, prefira classes `ds-*` e `app-*` em vez de violet/cinza genéricos (`violet-400`, `gray-200`), exceto para alertas.
