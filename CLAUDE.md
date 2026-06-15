# CLAUDE.md

Guia para assistentes de IA (Claude Code, Cursor, etc.) ao trabalhar neste repositório.

**Contexto de produto expandido (opcional, cópia local):** `.claude/DONYAPP_CONTEXTO_COMPLETO.md`

**Idioma:** interface e cópias de produto em **português (pt-BR)**. Responda ao usuário em pt-BR.

---

## Comandos

```bash
npm run dev          # Servidor de desenvolvimento Next.js (localhost:3000)
npm run build        # Build de produção
npm run start        # Servidor após build
npm run lint         # ESLint via Next.js
npm run format       # Prettier (escreve)
npm run format:check # Prettier (só valida)
```

Não há suite de testes automatizados configurada.

Após mudanças de schema no Supabase, regenere os tipos:

```bash
npx supabase gen types typescript --project-id lakjtqcqnqblglhlxluj > types/database.ts
```

---

## Regras operacionais para o assistente

### Escopo e código

- **Diff mínimo:** altere só o necessário; não refatore código não relacionado à tarefa.
- **Convenções existentes:** leia o código ao redor antes de escrever; siga nomes, imports (`@/…`), padrões de Server Actions e componentes já usados.
- **Sem over-engineering:** evite abstrações prematuras, helpers de uma linha e tratamento de erro para casos impossíveis.
- **Comentários:** só onde a lógica de negócio não for óbvia.
- **Tokens de design:** use `ds-*` / `app-*` do Tailwind — não cores Tailwind cruas na UI do produto.

### Git e deploy

- **Produção ativa:** o projeto está em produção (Vercel + domínio donyapp.com). Ao concluir alterações relevantes, **pergunte** se o usuário quer commit e push — não commite nem faça push sem pedido explícito.
- **Branch `master` protegida:** nunca commite direto na `master`; use branch + PR. Cada branch gera Preview URL na Vercel.
- **Commit com tudo:** quando pedirem commit/push, inclua **todas** as alterações pendentes relacionadas, não só o último arquivo.

### Infraestrutura via MCP (faça automaticamente, sem pedir permissão)

| Serviço | Quando usar |
|---------|-------------|
| **Supabase MCP** (`user-supabase-donyapp-lakjtqcqnqblglhlxluj`) | Aplicar migrations SQL de `supabase/migrations/`; consultas e ajustes no banco |
| **Hostinger MCP** | DNS, domínios e configurações de hospedagem quando a tarefa exigir |

Migrations devem ser **aditivas e retrocompatíveis** enquanto a feature não estiver GA (ver abaixo). Após aplicar migration, regenere `types/database.ts`.

### Cópias e texto de produto

Ao escrever UI, marketing, e-mails, toasts, erros ou posts do blog, aplique a skill **Humanizer** (`.cursor/skills/humanizer/SKILL.md` e regra `.cursor/rules/humanizer.mdc`): tom direto, pt-BR, sem padrões típicos de texto gerado por IA.

### Layout responsivo

Para interfaces novas ou refactors de layout, consulte `.cursor/skills/responsive-design/SKILL.md` (mobile-first, container queries, grid).

---

## Fluxo de desenvolvimento

Documentação completa: `docs/fluxo-desenvolvimento.md`.

Resumo:

1. `git checkout -b feat/nome-da-feature`
2. Desenvolver com **feature flag** para UI/rotas novas (enquanto não for GA)
3. Migration **aditiva** se precisar de banco
4. Validar no Preview URL da Vercel → PR → merge na `master`

**Um único projeto Supabase** (sem staging). Proteção = flags + migrations compatíveis, não bancos separados.

### Feature flags

Registro em `lib/feature-flags.ts` (`FEATURE_FLAGS` + espelho em `CLIENT_ENV_FLAGS`).

| Mecanismo | Onde liga | Runtime? |
|-----------|-----------|----------|
| ENV `NEXT_PUBLIC_FF_*` | Vercel Env Vars | Não (redeploy) |
| Tabela `feature_flags` | Supabase | **Sim** |

Resolução no servidor (`lib/feature-flags.server.ts`): **banco → ENV → false**.

```ts
// Server Component / Server Action
import { isFeatureEnabled } from "@/lib/feature-flags.server";
if (await isFeatureEnabled("minha_flag")) { /* … */ }

// Client Component (só ENV)
import { isFeatureEnabledFromEnv } from "@/lib/feature-flags";
if (isFeatureEnabledFromEnv("minha_flag")) { /* … */ }
```

**Gating por conta** (liberar só para alguns clientes): coluna dedicada em `accounts` (ex.: `album_board_enabled`), não flag global.

### Disciplina de migrations

- Enquanto feature pré-GA: `ADD COLUMN` com DEFAULT/NULL, nova tabela, índice.
- **Nunca** DROP / RENAME / NOT NULL sem default num passo só.
- Limpeza destrutiva só depois da feature 100% no ar.

---

## Arquitetura

**Donyapp** é um SaaS para fotógrafos e videomakers gerenciarem pós-produção via Kanban.

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 14 App Router, React 18, TypeScript strict |
| Estilo | Tailwind CSS 3 (`tailwind.config.js`), tokens `ds-*` |
| Auth + DB | Supabase (PostgreSQL + RLS + Google OAuth) |
| Pagamentos | Asaas (`lib/payments/`) — planos Free e Pro |
| E-mail | Resend (`lib/email/`) |
| Calendário | Google Calendar OAuth (`lib/google-calendar/`) |
| Kanban DnD | @dnd-kit |
| Animações | Framer Motion |
| Deploy | Vercel + cron (`vercel.json` → 08:00 UTC) |
| Analytics | @vercel/analytics |

**Domínios:** produção em `donyapp.com`; API Supabase com domínio customizado `auth.donyapp.com` (ref: `lakjtqcqnqblglhlxluj`).

---

## Estrutura de rotas

```
app/
  page.tsx                      # Landing (pública)
  blog/                         # Blog público (/blog, /blog/[slug])
  login/, signup/, forgot-password/
  por-que-usar/                 # Página marketing
  politica-de-privacidade/, termos-de-servico/
  formulario/[slug]/            # Formulário público (sem login)
  p/                            # Links públicos curtos
  invite/[token]/               # Aceitar convite de equipe
  auth/callback/                # OAuth Supabase PKCE
  (app)/                        # Área autenticada (layout exige sessão)
    dashboard/                  # Métricas
    board/                      # Kanban (UI: "Pós-Produção")
    jobs/[id]/                  # Detalhe do job
    contacts/                   # Clientes
    tasks/                      # Tarefas (Pro)
    notes/                      # Anotações
    agenda/                     # Calendário
    formularios/                # Formulários internos + modelos + recebidos
    reports/                    # Relatórios (Pro)
    support/                    # Suporte in-app
    feedback/                   # Sugestões de features
    settings/                   # Perfil, kanban, equipe, e-mail, agenda, plano, import
  admin/                        # Admin plataforma (DONYAPP_ADMIN_EMAILS)
    planos/, blog/, feedback/, support/, roadmap/, apresentacao/
  api/
    payment/card/create/        # Checkout Pro
    webhooks/asaas/             # Eventos Asaas
    cron/finalize-subscriptions/
    email/send/
    integrations/google/        # OAuth + eventos Calendar
    formularios/                # Templates e submissões públicas
    invitations/send/
    subscription/cancel/
```

### Rotas públicas (middleware)

Definidas em `lib/supabase/middleware.ts` → `isPublic`: `/`, `/login`, `/signup`, `/forgot-password`, `/auth/*`, `/invite/*`, `/blog*`, `/formulario/*`, `/p/*`, `/por-que-usar`, legal, webhooks, cron, sitemap/robots.

Usuário não autenticado em rota protegida → redirect `/login`.

---

## Auth e acesso a dados

- **`middleware.ts` (raiz):** CSP com nonce (`lib/csp.ts`), CORS (`lib/cors-origin.ts`), delega sessão a `updateSession`.
- **Clientes Supabase:**
  - `lib/supabase/client.ts` — browser (anon, RLS)
  - `lib/supabase/server.ts` — server (anon, cookies)
  - `lib/supabase/service-role.ts` — service role (admin, webhooks, provisionamento)
- **Multitenancy:** `accounts` é a unidade de isolamento; `users.account_id` + RLS.
- **Primeiro login:** provisionamento em `lib/auth/provision-new-studio.ts`.
- **Admin plataforma:** `lib/admin/platform-admin.ts` + `DONYAPP_ADMIN_EMAILS`.

---

## Planos e limites

Fonte canônica: `lib/plan-limits.ts`.

| Plano | Preço | Limites principais |
|-------|-------|-------------------|
| Free | R$ 0 | 5 jobs ativos, 20 contatos, 4 etapas Kanban (copy), 1 usuário |
| Pro mensal | R$ 37,90 | Ilimitado + equipe + e-mail entrega + Tarefas + Relatórios |
| Pro anual | R$ 377,48 | 17% desconto sobre 12× mensal |

Gating Pro na UI: prop `isPro` no `AppShell`; badges "PRO" em `/tasks`, `/reports`. Funções como `canCreateAlbum()` para features específicas.

---

## Bibliotecas e pastas importantes

| Caminho | Propósito |
|---------|-----------|
| `lib/plan-limits.ts` | Limites e preços por plano |
| `lib/payments/` | Asaas (checkout, webhook, assinatura) |
| `lib/email/` | Resend, templates transacionais |
| `lib/google-calendar/` | OAuth e API Calendar |
| `lib/dashboard-metrics.ts` | Métricas do dashboard |
| `lib/notifications.ts` | Notificações in-app |
| `lib/formularios/` | Pipeline de formulários públicos |
| `lib/blog/actions.ts` | Leitura de posts + marcação lida |
| `lib/feature-flags*.ts` | Feature flags |
| `lib/auth/` | Provisionamento, convites, OAuth |
| `lib/validation/` | Validação de contato, job, etc. |
| `components/ui/` | Primitivos (Button, Input, Avatar…) |
| `components/app/` | Componentes da área logada |
| `components/marketing/` | Landing, blog cards, header marketing |
| `components/layout/` | AppShell, sidebar, nav mobile |
| `types/database.ts` | Tipos Supabase — **não editar manualmente** |
| `types/blog.ts` | Tipos do módulo blog |

---

## Design system

Referência: `DESIGN_SYSTEM.md` + `tailwind.config.js` + `app/globals.css`.

- Fundo creme `ds-cream`, texto `ds-ink`, acento laranja `ds-accent` (#ff5500)
- Superfícies: `ds-surface`, `ds-elevated`, bordas `ds-border`
- Tipografia: Inter via `next/font`
- **Ignore** paleta antiga em `requisitos_produto.json` — use tokens `ds-*`

**Prettier:** 2 espaços, semicolons, trailing commas es5, print width 88.

---

## Módulos recentes / em evolução

### Blog (`/blog`, `/admin/blog`)

- Posts em `blog_posts`; leitura em `blog_post_reads` (sidebar in-app).
- Migration: `supabase/migrations/20260608120000_blog_posts.sql`.
- Público: listagem e post por slug. Admin: CRUD em `/admin/blog`.

### Formulários (`/formularios`, `/formulario/[slug]`)

- Modelos internos, submissões em `/formularios/recebidos`.
- API pública: `/api/formularios/[slug]/submit`.
- Notificação por e-mail via `TEAM_NOTIFY_EMAIL`.

### Suporte in-app (`/support`, `/admin/support`)

- Tickets de suporte; contador no menu Ajuda do AppShell.

---

## Variáveis de ambiente

Lista completa: `.env.example`.

Essenciais:

```
NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY          # Nunca no client
NEXT_PUBLIC_APP_URL                # OAuth, links em e-mails (obrigatório no build prod)
RESEND_API_KEY / RESEND_FROM / TEAM_NOTIFY_EMAIL
ASAAS_API_KEY / ASAAS_API_URL / ASAAS_WEBHOOK_TOKEN
CRON_SECRET
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_CALENDAR_OAUTH_STATE_SECRET
DONYAPP_ADMIN_EMAILS
NEXT_PUBLIC_SUPPORT_EMAIL / NEXT_PUBLIC_SUPPORT_WHATSAPP_E164  # Ajuda na sidebar
```

**Preview Vercel:** Asaas sandbox (`api-sandbox.asaas.com`), Resend com remetentes de teste.

**PowerShell + Asaas:** `$env:ASAAS_API_KEY='chave_com_$'` (evita expansão do `$`).

---

## Documentação adicional no repo

| Arquivo | Conteúdo |
|---------|----------|
| `DESIGN_SYSTEM.md` | Tokens e componentes |
| `docs/fluxo-desenvolvimento.md` | Branches, flags, migrations |
| `docs/supabase-email-templates.md` | Templates Auth Supabase |
| `requisitos_produto.json` | Requisitos históricos (cruzar com código) |
| `KANBAN_MOBILE_FIX.md`, `HOTFIX_CONTAINER_QUERIES.md` | Notas de QA mobile |

---

## Checklist rápido antes de entregar

- [ ] Cópias em pt-BR e humanizadas (se texto de produto)
- [ ] Tokens `ds-*` na UI
- [ ] Rota nova atrás de feature flag (se pré-GA)
- [ ] Migration aditiva aplicada via Supabase MCP + tipos regerados
- [ ] `npm run lint` e `npm run build` sem erros (quando alteração relevante)
- [ ] Perguntar sobre commit/push se feature pronta em produção
