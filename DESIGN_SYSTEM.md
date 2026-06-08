# Design System — Donyapp

> **Fonte da verdade.** Toda nova tela, componente ou ajuste visual do app, da
> landing e do admin deve seguir este documento. Tokens canônicos vivem em
> [`tailwind.config.js`](tailwind.config.js) e [`app/globals.css`](app/globals.css);
> este arquivo espelha os mesmos nomes e explica quando usar cada um.
>
> **Versão atual:** v0.1 (25 / 05 / 2026) — ver [Changelog](#changelog) ao final.

Antes de criar qualquer interface no projeto, leia as seções **Princípios**,
**Decisões registradas** e o trecho de **Componentes** correspondente à peça que
você vai produzir. Os tokens `ds-*` substituem cores cruas do Tailwind
(`violet-400`, `gray-200`, etc.) — exceto onde alertas semânticos exigirem.

---

## Princípios

- **Canvas é creme**, nunca branco puro — branco fica reservado a superfícies
  elevadas (cards, modais, sidebar).
- **Texto** quase preto (`ds-ink`) para títulos e ações; neutros quentes para
  secundário e metadados.
- **Acento** laranja saturado (`ds-accent` `#ff5500`) aparece em **no máximo um
  lugar por tela** — CTA primário, etapa ativa do Kanban ou prazo crítico.
- **Bordas** discretas (`ds-border`/`ds-hairline`), sombras leves com alpha
  sobre `ds-ink`.
- **Cantos** consistentes: `8px` para controles, `12–14px` para cards, `18px`
  para modais.
- **Movimento** curto: `120ms` para hover/focus, `180ms` para modais/drawers.
- **Toda copy em pt-BR direto no JSX** — i18n não é prioridade.

---

## Fundamentos

### Paleta

| Token | Hex | Uso |
|-------|-----|-----|
| `ds-cream` | `#f5f2ef` | Canvas da app, fundos de página, hero |
| `ds-cream-50` | `#fbfaf8` | Documentação, fundos mais suaves |
| `ds-ink` | `#0c0a09` | Títulos, texto principal, sidebar ativa |
| `ds-ink-2` | `#2a2622` | Texto secundário |
| `ds-accent` | `#ff5500` | CTA único por tela, etapa ativa, prazo crítico |
| `ds-accent-soft` | `#ffeee4` | Fundo suave para accent (badges, hovers) |
| `ds-muted` | `#6b6660` | Texto terciário, metadados |
| `ds-muted-2` | `#908a83` | Placeholders, labels uppercase |
| `ds-border` | `#e3ddd4` | Bordas padrão |
| `ds-border-strong` | `#d4ccc0` | Bordas sobre superfícies elevadas |
| `ds-hairline` | `#ece8e1` | Divisórias leves, separadores |
| `ds-surface` | `#ffffff` | Cards, modais — **não o canvas** |
| `ds-elevated` | `#ede8e3` | Sidebar interna de mocks, superfícies levantadas |
| `ds-on-dark` | `#fafaf9` | Texto sobre fundo `ink` |

**Sinais funcionais** — usar sempre o par `cor + cor-soft`:

| Token | Hex | Uso |
|-------|-----|-----|
| `ds-success` / `ds-success-soft` | `#1f8a5b` / `#e2f3ea` | Entregue, confirmação |
| `ds-warn` / `ds-warn-soft` | `#b97700` / `#fbeeda` | Prazo próximo (≤ 5 dias) |
| `ds-danger` / `ds-danger-soft` | `#c43838` / `#fbe3e3` | Atrasado, ação destrutiva |
| `ds-info` / `ds-info-soft` | `#2a6fdb` / `#e3edfb` | Informação neutra |

**Aliases legados `app.*`** (`app-canvas`, `app-sidebar`, `app-primary`,
`app-border`) — manter para código existente, não introduzir em código novo.

### Tipografia

- **Família:** `Inter` via `--font-inter` no `RootLayout`.
- **4 escalas** de uso no app:
  - Display (landing/headlines): pesos **800–900**, `text-4xl`+
  - Título de tela: `text-2xl font-semibold/bold`
  - Corpo: `text-sm`–`text-base`
  - Metadado / label: `text-xs uppercase tracking-wide text-ds-muted-2`
- Landing usa `displayClassName` na `landing-page.tsx`.

### Espaçamento

Múltiplos de 4 (Tailwind padrão). Convenções:

- Padding global do shell autenticado: `p-6` em `<main>`.
- Gaps entre blocos: `gap-4`–`gap-6`.
- Touch target mínimo (WCAG 2.1): `2.75rem` / `44px` (`spacing.touch-target`).
- Largura máxima de marketing: `1200px` (`max-w-[1200px]`).

### Raios (5)

| Classe | Valor | Uso |
|--------|-------|-----|
| `rounded-ds-sm` | `4px` | Tags inline, dot indicators |
| `rounded-ds-md` | `6px` | Badges, chips pequenos |
| `rounded-ds-lg` | `8px` | **Padrão de controle** — botões, inputs, selects |
| `rounded-ds-xl` | `12px` | Tooltips, dropdowns, cards menores |
| `rounded-ds-card` | `14px` | Cards de job, painéis, modais menores |
| `rounded-ds-2xl` | `18px` | Modais, drawers |
| `rounded-ds-pill` | `999px` | Badges de prazo, tags pill |

### Sombras (4)

| Classe | Uso |
|--------|-----|
| `shadow-ds-sm` | Elevação leve, hover de card |
| `shadow-ds-md` | Menus flutuantes, popovers |
| `shadow-ds-lg` | Painéis, modais médios |
| `shadow-ds-pop` | Modais grandes, command palette |

Legado: `shadow-ds-card` mantido para landing/código antigo.

### Transições (2)

| Classe | Valor | Uso |
|--------|-------|-----|
| `duration-ds-fast` | `120ms` | Hover, focus |
| `duration-ds-modal` | `180ms` | Modais, drawers |

Sempre acompanhar de `ease-out`. Legado: `duration-ds` (`150ms`).

---

## Componentes

Implementações vivem em [`components/ui/`](components/ui/). Reutilize em vez de
recriar variantes ad-hoc.

### Formulários

- **Button** ([`components/ui/button.tsx`](components/ui/button.tsx)) — 4 variantes × 3 tamanhos
  - Variantes: `primary` (fundo `ds-accent`, texto branco), `secondary`
    (borda `ds-border`, fundo branco), `ghost` (hover `ds-cream`),
    `danger` (semântico `ds-danger`).
  - Tamanhos: `sm`, `md` (padrão), `lg`.
  - Texto de botão segue regras da seção **Voz e tom**.
- **Input / Select / Textarea / Combobox** — borda `ds-border`, foco com anel
  `ds-accent/25`, raio `rounded-ds-lg`.
- **Checkbox / Radio / Switch** — estados acessíveis (foco visível, contraste
  AA), `Switch` para toggles de feature, `Checkbox` para múltipla seleção.
- **Acessibilidade:** todo controle precisa de `label` associado, `aria-*`
  apropriado em estados de erro, e touch target ≥ 44px em mobile.

### Exibição de dados

- **Card** ([`components/ui/card.tsx`](components/ui/card.tsx)) — padrão
  (`ds-surface` + `ds-border` + `rounded-ds-card`) e variantes de **stat**
  (dashboard).
- **Table** — bordas `ds-hairline`, header `text-ds-muted-2 uppercase`.
- **Badge** ([`components/ui/badge.tsx`](components/ui/badge.tsx)) — 6 tons
  funcionais (neutro, accent, success, warn, danger, info) + variante **Pro**.
- **Avatar** ([`components/ui/avatar.tsx`](components/ui/avatar.tsx)) — cores
  determinísticas a partir do nome/ID (não aleatórias).
- **Tag** — usa `rounded-ds-pill`.

### Navegação

- **App shell completo:** sidebar `220px` + topbar `56px`.
- **Item de menu** tem 3 estados: padrão, hover, ativo (`ds-ink` background
  com `ds-on-dark` texto).
- **Tabs**, **Breadcrumb**, **Page header** — componentes em `components/layout/`.

### Feedback — hierarquia de severidade

Use o nível mínimo necessário, na ordem:

1. **Inline** (texto abaixo do campo) — validação de formulário, dica contextual.
2. **Toast** ([`components/ui/app-toaster.tsx`](components/ui/app-toaster.tsx)) —
   confirmação de ação ("Job salvo"), erros transitórios.
3. **Alert** ([`components/ui/alert.tsx`](components/ui/alert.tsx)) — aviso
   persistente no topo da tela ("Conexão com Google expirou").
4. **Modal** ([`components/ui/modal.tsx`](components/ui/modal.tsx),
   [`dialog.tsx`](components/ui/dialog.tsx)) — bloquear até confirmação;
   destruição, paywall, decisão crítica.

Outros: **Empty state** ([`empty-state.tsx`](components/ui/empty-state.tsx))
para listas vazias com CTA; **Skeleton** ([`skeleton.tsx`](components/ui/skeleton.tsx))
para loading com forma já definida.

---

## Kanban

O Kanban é o coração do produto — segue regras próprias.

- **Board completo** — colunas por etapa (`kanban_stages`), drag & drop entre
  colunas adjacentes do fluxo.
- **Anatomia do job card:** nome do cliente (título), tipo de trabalho (badge),
  data de entrega (badge de prazo), avatar/iniciais do cliente, indicador de
  etapa atual.
- **4 estados de prazo** (ordem de prioridade visual):
  1. **Atrasado** — `ds-danger` + `ds-danger-soft`
  2. **Crítico** (≤ 2 dias) — `ds-accent` + `ds-accent-soft`
  3. **Próximo** (≤ 5 dias) — `ds-warn` + `ds-warn-soft`
  4. **Normal** — `ds-muted` neutro
- **Drag & drop:** placeholder com `ds-border-strong` tracejada; durante drag,
  card eleva com `shadow-ds-pop`.
- **Mobile:** hotfix em produção (`KANBAN_MOBILE_FIX.md`); componentes
  específicos entram em v0.2.
- **Personalização de etapas:** cores vêm do banco (`kanban_stages.color`) e
  estão no `safelist` do Tailwind — qualquer cor nova precisa entrar no
  safelist para sobreviver ao tree-shaking.

---

## Padrões transversais

### Pro badge (3 contextos)

1. **Menu** — item bloqueado mostra badge `Pro` à direita, item permanece
   clicável e leva ao paywall.
2. **Inline** — ação dentro de tela aberta para Free; badge `Pro` ao lado do
   controle, tooltip explica o que desbloqueia.
3. **Paywall** — modal com a feature, benefícios em bullets curtos, CTA
   "Assinar Pro" + link "Continuar no plano gratuito".

Implementação canônica em [`lib/plan-limits.ts`](lib/plan-limits.ts).

### Formatação de deadline em pt-BR

- Hoje / amanhã / depois de amanhã: usar palavras (`"hoje"`, `"amanhã"`).
- Próximos 6 dias: dia da semana (`"sex"`, `"qua"`).
- Acima de 7 dias: data curta (`"12/jun"`); inclui ano se ≠ ano atual.
- Atrasado: prefixo `"há"` + duração (`"há 3 dias"`).

### Fluxo do e-mail de entrega

Disparado por mudança de etapa do job para a final ("Entregue"). Template em
[`lib/email/`](lib/email/). Sempre incluir: nome do cliente, link da galeria,
prazo de download, assinatura do estúdio.

### Limites Free — regras de comunicação

- Antes de atingir: nenhuma menção (não criar ansiedade).
- Ao atingir: bloqueio com mensagem clara do limite + CTA Pro.
- Nunca usar linguagem de culpa ("você excedeu"); usar fato neutro
  ("plano Free permite X").

---

## Voz e tom

### 4 adjetivos da voz

A comunicação Donyapp é **direta, calma, especialista e brasileira**.

- **Direta** — uma ideia por frase, verbo claro, sem rodeio.
- **Calma** — não usa urgência manipulativa, exclamação ou caps lock.
- **Especialista** — fala a língua do fotógrafo (entrega, prova, álbum, prazo).
- **Brasileira** — pt-BR natural, sem "modo escuro" forçado de tradução.

### Tom por situação

| Situação | Tom |
|----------|-----|
| Onboarding | Acolhedor, primeira pessoa do plural ("vamos configurar") |
| Confirmação de ação | Neutro e curto ("Job criado") |
| Erro de validação | Específico, sem culpar ("Informe um e-mail válido") |
| Erro de sistema | Honesto + próximo passo ("Não foi possível salvar. Tente novamente.") |
| Paywall | Calmo, explica o valor, não pressiona ("Disponível no plano Pro") |
| Comunicação com cliente final | Formal-cordial, em nome do estúdio |

### Do / Don't em copy

- ✅ "Salvar alterações" / ❌ "Salvar!"
- ✅ "Entregue ao cliente" / ❌ "Marcar como concluído"
- ✅ "Plano Free permite 3 jobs ativos" / ❌ "Você excedeu o limite"
- ✅ "Conectar Google Agenda" / ❌ "Sincronizar com Google Calendar™"

### Glossário (termos canônicos)

- **Job** — trabalho contratado (ensaio, casamento, edição de vídeo).
- **Etapa** / **estágio** — coluna do Kanban (não "status", não "fase").
- **Entregar** — ação final que envia o e-mail e move o job para concluído.
- **Cliente** — contato/contratante; nunca "lead" no app autenticado.
- **Plano Free** / **Plano Pro** — sempre com inicial maiúscula.

### Regras de texto de botão

- Verbo no infinitivo: "Salvar", "Cancelar", "Entregar".
- Sem pontuação final.
- Máximo 3 palavras quando possível.
- Botão destrutivo nomeia a consequência: "Excluir job" (não "Confirmar").

---

## Decisões registradas

1. **Canvas é creme, nunca branco puro** — branco fica reservado a superfícies
   elevadas (cards, modais, sidebar).
2. **Accent (`#ff5500`) aparece em no máximo um lugar por tela** — se já há um
   CTA primário, a etapa ativa do Kanban não pode também ser accent.
3. **Toda copy em pt-BR direto no JSX** — i18n não é prioridade; não envelopar
   strings em helpers de tradução.
4. **Tokens canônicos vivem em `tailwind.config.js` e `app/globals.css`** —
   este DS espelha esses nomes. Mudar token é mudar contrato: atualize as duas
   fontes e bumpe a versão aqui.

---

## Onde está no código

- **Tokens Tailwind:** [`tailwind.config.js`](tailwind.config.js) →
  `theme.extend.colors.ds`, `boxShadow`, `borderRadius`, `transitionDuration`.
- **Base global:** [`app/globals.css`](app/globals.css) → `:root` com
  `--background` / `--foreground`.
- **Componentes UI:** [`components/ui/`](components/ui/).
- **Shell e navegação:** [`components/layout/`](components/layout/).
- **Referência de uso em marketing:**
  [`components/marketing/landing-page.tsx`](components/marketing/landing-page.tsx).

---

## Como aplicar ao criar algo novo

Checklist mínimo antes de abrir PR com UI nova:

- [ ] Usei tokens `ds-*` em vez de cores cruas (`violet-400`, `gray-200`)?
- [ ] Há apenas **um** uso de `ds-accent` na tela?
- [ ] Canvas está em `ds-cream`, superfícies em `ds-surface`?
- [ ] Componentes vieram de `components/ui/` (não recriei Button/Card/Modal)?
- [ ] Copy em pt-BR seguindo voz/tom e glossário?
- [ ] Touch targets ≥ 44px em mobile?
- [ ] Severidade de feedback no nível mínimo (inline > toast > alert > modal)?
- [ ] Se tocou em token, atualizei `tailwind.config.js`, `app/globals.css` e
      bumpei a versão deste documento?

---

## Changelog

### v0.2 · planejado

Em estudo para a próxima versão.

**Planejado**

- Página de **Marca** — logo, espaço de respiro, do/don't, uso sobre fotos.
- Exportar tokens para um pacote `@dony/tokens` compartilhado entre app e site.
- Componentes **mobile-specific** do Kanban (já existe hotfix em produção —
  ver [`KANBAN_MOBILE_FIX.md`](KANBAN_MOBILE_FIX.md)).
- Padrão de **filtros** e **combobox com busca** (listas > 10).
- Padrão de **onboarding** com driver.js — tour, passos e copy.

**Não vai entrar**

- Modo escuro — usuário edita em monitor calibrado; creme não compete com a
  imagem.
- Ilustrações geradas — só entrarão como assets reais, com regra de uso.

### v0.1 — 25 / 05 / 2026

Primeira versão escrita.

**Adicionado**

- **Fundamentos** — paleta (creme, ink, accent, sinais), tipografia Inter em
  4 escalas, espaçamento em múltiplos de 4, 5 raios, 4 sombras, 2 durações de
  transição.
- **Formulários** — Button (4 variantes × 3 tamanhos), Input, Select, Textarea,
  Checkbox, Radio, Switch + regras de acessibilidade.
- **Exibição de dados** — Card (padrão + variantes de stat), Table, Badge
  (6 tons + Pro), Avatar (com cores determinísticas), Tag.
- **Navegação** — app shell completo (sidebar 220px + topbar 56px), 3 estados
  de item de menu, Tabs, Breadcrumb, Page header.
- **Feedback** — Toast, Alert, Modal, Empty state, Skeleton + hierarquia de
  severidade (inline → toast → alert → modal).
- **Kanban** — board completo, anatomia do job card, 4 estados de prazo,
  comportamento de drag & drop, regras mobile, personalização de etapas.
- **Padrões** — Pro badge nos 3 contextos (menu, inline, paywall), formatação
  de deadline em pt-BR, fluxo do e-mail de entrega, regras de comunicação de
  limites Free.
- **Voz e tom** — 4 adjetivos da voz, tabela de tom por situação, do/don't em
  copy real, glossário, regras de texto de botão.

**Decisões registradas** — ver seção dedicada acima.
