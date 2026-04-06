# PRODUCT.md — Documento Oficial de Requisitos
> **Este arquivo é a fonte da verdade do projeto.**
> Siga estritamente tudo que está aqui. Não invente funcionalidades, não mude a stack, não altere o design sem instrução explícita do produto owner.

---

## CONTEXTO DO PROJETO

Sistema SaaS de gestão de pós-produção (Kanban) especializado para fotógrafos e videomakers brasileiros. O produto resolve o problema de ferramentas genéricas (Trello, Asana) não serem feitas para o fluxo real de edição de foto e vídeo.

**Público-alvo:**
- Fotógrafos solo ou em estúdio (newborn, casamento, família, eventos)
- Videomakers e editores freelancer
- Pequenos estúdios com 1 a 5 editores

---

## STACK TÉCNICA — NÃO ALTERAR

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Banco de dados / Auth | Supabase (PostgreSQL + Auth Google OAuth) |
| Drag-and-drop Kanban | dnd-kit |
| Envio de e-mail | Resend |
| Pagamentos (cartão, link, assinaturas) | Asaas |
| Deploy | Vercel |
| Ícones | Lucide React |
| Onboarding Tour | driver.js |

**Regras de stack:**
- Nunca substituir Supabase por outro banco
- Nunca substituir Asaas como provedor de pagamentos do produto
- Nunca usar Prisma — usar Supabase client direto
- Nunca usar next-auth — usar Supabase Auth com Google OAuth

---

## ESTRUTURA DE BANCO DE DADOS

Todas as tabelas de dados (jobs, contatos, configurações do kanban) devem ser vinculadas ao `account_id`, não ao `user_id`. Isso garante que a equipe compartilhe os mesmos dados.

```
accounts          → conta principal do estúdio (1 por assinatura)
account_members   → relação users <-> accounts (role: 'admin' | 'member')
users             → perfil individual de cada usuário (criado no primeiro login)
invitations       → convites pendentes (email, token, expires_at, status)
contacts          → clientes (vinculados a account_id)
jobs              → trabalhos de edição (vinculados a account_id)
kanban_stages     → etapas do kanban (vinculadas a account_id, ordenadas por position)
```

---

## NAVEGAÇÃO — MENU SIDEBAR

O menu lateral tem **exatamente 3 itens** + configurações no rodapé:

| Item | Rota | Descrição |
|---|---|---|
| Dashboard | `/dashboard` | Tela inicial com métricas |
| Contatos | `/contacts` | Cadastro e gestão de clientes |
| Edições | `/board` | Kanban de pós-produção |
| ⚙️ Configurações | `/settings` | Rodapé da sidebar |

**Não adicionar itens ao menu sem instrução explícita.**

---

## MÓDULO: AUTH

- Login **exclusivamente** com Google OAuth (sem cadastro por e-mail/senha)
- Ao primeiro login: criar registro em `users` e `accounts`, associar via `account_members` com role `admin`
- Redirecionar para `/dashboard` após login
- Sessão persistente via Supabase Auth

---

## MÓDULO: DASHBOARD

Cards de métricas no topo, lista de jobs urgentes abaixo. **Sem gráficos complexos no MVP.**

| Métrica | Lógica |
|---|---|
| Total de jobs ativos | Jobs com status diferente de "Entregue" |
| Jobs atrasados | Jobs com prazo vencido e não entregues |
| Jobs com prazo próximo | Prazo em até 3 dias, não entregues |
| Jobs entregues no mês | Entregues no mês atual |
| Jobs a editar este mês | Prazo dentro do mês atual |

---

## MÓDULO: CONTATOS

Campos:

| Campo | Tipo | Obrigatório |
|---|---|---|
| Nome completo | text | ✅ |
| E-mail | email | ✅ |
| Telefone/WhatsApp | text | ❌ |
| Observações | textarea | ❌ |

Ações: criar, editar, excluir (bloquear se houver jobs ativos vinculados), buscar por nome ou e-mail.

---

## MÓDULO: EDIÇÕES (JOBS + KANBAN)

### Campos do Job

| Campo | Tipo | Obrigatório |
|---|---|---|
| Nome do job | text | ✅ |
| Contato vinculado | select (contacts) | ❌ |
| Tipo | enum: Foto / Vídeo / Foto+Vídeo | ✅ |
| Prazo de entrega | date | ✅ |
| Observações | textarea | ❌ |
| Link do material final | url | ❌ |
| Etapa do kanban | FK kanban_stages | Auto (primeira etapa) |

### Kanban

- Drag-and-drop entre colunas via **dnd-kit**
- Cada coluna = uma etapa do `kanban_stages` da conta
- Ao mover para a **última etapa**: exibir modal perguntando se quer enviar e-mail ao cliente
- Etapas padrão criadas no primeiro acesso:

| Ordem | Nome | Cor de fundo (Tailwind) |
|---|---|---|
| 1 | Backup | `ds-accent/10` |
| 2 | Em Edição | `amber-50` |
| 3 | Em Aprovação | `blue-50` |
| 4 | Entregue | `pink-50` |

### Personalização do Kanban (em /settings)

- Renomear etapas
- Adicionar etapas
- Reordenar (drag-and-drop)
- Excluir (avisar se houver jobs na coluna)
- **Limite por plano:** Free = máx 4 etapas / Pro = ilimitado

---

## MÓDULO: E-MAIL AO CLIENTE

**O envio NÃO é automático.** É manual e opcional.

Fluxo:
1. Job movido para última etapa
2. Modal: "Deseja enviar e-mail ao cliente?"
3. Se sim → abre editor com template pré-preenchido e editável
4. Profissional edita e confirma envio
5. Enviado via **Resend**

Template padrão:
```
Assunto: Seu material está pronto! 📸

Olá [Nome do Cliente],

Seu material está finalizado e pronto para você!

🔗 Link de acesso: [link inserido pelo profissional]

Qualquer dúvida, estou à disposição.

[Nome do Fotógrafo — configurado em Settings]
```

Remetente: `noreply@[dominio-do-produto].com.br`
Reply-to: e-mail do profissional (configurado em Settings)

**Disponível apenas no plano Pro.**

---

## MÓDULO: CONFIGURAÇÕES (/settings)

| Seção | Campos / Ações |
|---|---|
| Perfil | Nome de exibição, e-mail (reply-to), foto de perfil |
| Kanban | Gerenciar etapas (ver seção Kanban acima) |
| Equipe | Convidar membros, listar usuários ativos, remover acesso (admin only) |
| Plano | Plano ativo, nº de usuários, botão upgrade |
| Faturamento | Histórico de cobranças, detalhamento por usuário, próxima cobrança |

---

## MÓDULO: MULTI-USUÁRIO

### Modelo de cobrança
- Plano Pro (1 usuário): R$ 29,90/mês
- Cada usuário adicional: + R$ 19,90/usuário/mês

### Fluxo de convite
1. Admin acessa Settings → Equipe → Convidar usuário
2. Informa o e-mail do novo membro
3. Sistema envia e-mail com link único (token, expira em 48h) via Resend
4. Convidado clica no link → faz login com Google com aquele e-mail
5. Sistema vincula o usuário à `account` do admin via `account_members`
6. Cobrança incremental criada automaticamente no Asaas

> **Importante:** Google OAuth aceita qualquer e-mail com Conta Google — não precisa ser @gmail.com. Orientar usuário a criar Conta Google com seu e-mail profissional se ainda não tiver.

### Papéis

| Permissão | Admin | Member |
|---|---|---|
| Ver e mover jobs | ✅ | ✅ |
| Criar e editar jobs | ✅ | ✅ |
| Criar e editar contatos | ✅ | ✅ |
| Enviar e-mail ao cliente | ✅ | ✅ |
| Configurar etapas do kanban | ✅ | ❌ |
| Convidar / remover usuários | ✅ | ❌ |
| Gerenciar plano e pagamento | ✅ | ❌ |

### Remoção
- Admin remove membro em Settings → Equipe
- Acesso revogado imediatamente
- Cobrança cancelada no próximo ciclo
- Jobs do usuário removido permanecem na conta

---

## PLANOS

| Funcionalidade | Free | Pro |
|---|---|---|
| Jobs ativos | Até 5 | Ilimitado |
| Etapas no Kanban | Até 4 | Ilimitado |
| Contatos | Até 20 | Ilimitado |
| Envio de e-mail ao cliente | ❌ | ✅ |
| Usuários adicionais | ❌ | +R$ 19,90/usuário/mês |
| Trial Pro | — | 14 dias grátis |

### Meios de pagamento
- **Asaas:** checkout (cartão, link de pagamento, assinatura) e webhook para atualização automática do status da assinatura

---

## ONBOARDING TOUR

Biblioteca: **driver.js**

Disparado automaticamente apenas no **primeiro login** (checar campo `tour_completed` na tabela `users`).

| Passo | Elemento | Mensagem |
|---|---|---|
| 1 | `#menu-contatos` | "Comece por aqui! Cadastre seus clientes para vincular aos seus trabalhos." |
| 2 | `#btn-novo-contato` | "Clique aqui para adicionar um cliente. Basta o nome e o e-mail dele." |
| 3 | `#menu-edicoes` | "Aqui mora o coração do sistema: seu Kanban de pós-produção." |
| 4 | `#btn-novo-job` | "Crie um job para cada trabalho de edição. Defina o prazo e as observações." |
| 5 | `#kanban-board` | "Arraste os cards entre as colunas conforme avança na edição." |
| 6 | `#menu-settings` | "Personalize as etapas do seu fluxo aqui. Cada profissional tem um processo diferente." |

- Usuário pode pular a qualquer momento
- Em Settings: opção "Refazer o tour"
- Salvar `tour_completed = true` após conclusão ou skip

---

## DESIGN — REGRAS OBRIGATÓRIAS

### Paleta de cores

| Elemento | Valor |
|---|---|
| Primária (botões, destaques) | `violet-400` / `#A78BFA` — nunca saturado |
| Background geral | `#F0F4F3` ou `slate-50` |
| Background sidebar | `#FFFFFF` |
| Cards dos jobs | `#FFFFFF` com `shadow-sm` |
| Textos principais | `gray-800` |
| Textos secundários | `gray-500` |
| Bordas | `gray-200` |

**Cor de fundo por coluna do Kanban:**

| Coluna | Fundo Tailwind |
|---|---|
| Backup | `bg-ds-accent/10` |
| Em Edição | `bg-amber-50` |
| Em Aprovação | `bg-blue-50` |
| Entregue | `bg-pink-50` |

### Regras de design — NUNCA violar

- ✅ Cards do Kanban são sempre **brancos** — a cor vem do fundo da coluna
- ✅ Muito espaço em branco — gaps de 16-24px entre elementos
- ✅ Border radius generoso: `rounded-xl` (12-16px) nos cards
- ✅ Sombras suaves: `shadow-sm` apenas
- ✅ Fonte: **Inter** (importar do Google Fonts)
- ✅ Badges de tipo em pastel: fundo `-100`, texto `-700` da mesma cor
- ❌ Nunca usar cores saturadas ou vibrantes
- ❌ Nunca colocar background colorido nos cards (só nas colunas)
- ❌ Nunca usar sombras pesadas ou bordas grossas
- ❌ Nunca misturar muitas cores diferentes na mesma tela

### Badges de prazo no card
- Normal: sem badge
- Prazo em ≤3 dias: badge `amber-100` com ícone de relógio
- Atrasado: badge `red-100` com ícone de alerta

### Tipografia

| Elemento | Classes Tailwind |
|---|---|
| Título de página | `text-2xl font-bold text-gray-900` |
| Subtítulo / metadado | `text-sm text-gray-500` |
| Nome do job no card | `text-base font-semibold text-gray-800` |
| Observação no card | `text-sm text-gray-500 line-clamp-2` |
| Badge de status | `text-xs font-medium` |

---

## ROADMAP DE DESENVOLVIMENTO — STEP BY STEP

> ### ⚠️ REGRA PRINCIPAL — LER ANTES DE QUALQUER COISA
>
> **Execute exatamente um passo por vez.**
> Ao terminar cada passo, PARE completamente e pergunte:
>
> _"✅ [Nome do passo] concluído. Posso avançar para o próximo passo: [nome do próximo]?"_
>
> **Nunca avance sem confirmação explícita do dono do produto.**
> Nunca implemente funcionalidades de passos futuros antecipadamente.
> Se encontrar uma decisão técnica não coberta neste documento, pergunte antes de decidir sozinho.

---

### FASE 1 — FUNDAÇÃO (nunca pular, é a base de tudo)

---

#### PASSO 1 — Configuração do Ambiente e Repositório

O que fazer:
- Criar projeto Next.js 14 com TypeScript: `npx create-next-app@latest --typescript`
- Configurar Tailwind CSS
- Configurar ESLint + Prettier com regras padrão
- Criar repositório no GitHub e fazer primeiro commit
- Configurar variáveis de ambiente: `.env.local` com placeholders para Supabase, Resend, Asaas
- Criar `.env.example` documentado com todas as variáveis necessárias
- Instalar dependências base: `lucide-react`, `clsx`, `tailwind-merge`

Critério de conclusão: projeto rodando em `localhost:3000` com página inicial em branco, sem erros no console, repositório no GitHub com `.env.example` commitado.

---

#### PASSO 2 — Schema do Banco de Dados (Supabase)

> Este é o passo mais crítico. Schema errado agora = retrabalho em tudo depois.

O que fazer:
- Criar projeto no Supabase
- Criar todas as tabelas conforme schema abaixo — na ordem exata:

```sql
-- 1. accounts (conta do estúdio — unidade de cobrança)
create table accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- 2. users (perfil do usuário autenticado via Google)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  account_id uuid references accounts(id),
  name text,
  email text,
  avatar_url text,
  role text default 'admin' check (role in ('admin', 'member')),
  tour_completed boolean default false,
  created_at timestamptz default now()
);

-- 3. invitations (convites pendentes para novos membros)
create table invitations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade,
  email text not null,
  token text unique not null,
  role text default 'member',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz default now()
);

-- 4. contacts (clientes da conta)
create table contacts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  notes text,
  created_at timestamptz default now()
);

-- 5. kanban_stages (etapas do kanban — personalizáveis por conta)
create table kanban_stages (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade,
  name text not null,
  position integer not null,
  color text not null, -- classe tailwind do bg, ex: 'bg-violet-50'
  is_final boolean default false, -- true = última etapa (dispara modal de e-mail)
  created_at timestamptz default now()
);

-- 6. jobs (trabalhos de edição)
create table jobs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  stage_id uuid references kanban_stages(id) on delete set null,
  name text not null,
  type text not null check (type in ('foto', 'video', 'foto_video')),
  deadline date not null,
  notes text,
  delivery_link text,
  created_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. subscriptions (assinaturas e planos)
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade,
  plan text default 'free' check (plan in ('free', 'pro')),
  status text default 'active' check (status in ('active', 'trialing', 'past_due', 'canceled')),
  trial_ends_at timestamptz,
  current_period_ends_at timestamptz,
  extra_users integer default 0,
  asaas_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

- Configurar Row Level Security (RLS) em todas as tabelas: usuários só acessam dados do próprio `account_id`
- Criar políticas RLS básicas
- Configurar cliente Supabase no projeto Next.js (`lib/supabase/client.ts` e `lib/supabase/server.ts`)

Critério de conclusão: todas as tabelas criadas no Supabase, RLS ativo, cliente configurado no projeto, sem erros de conexão.

---

#### PASSO 3 — Autenticação com Google OAuth

O que fazer:
- Configurar Google OAuth no Supabase (Google Cloud Console + Supabase Auth)
- Criar páginas: `/login` (única página pública)
- Implementar fluxo completo:
  - Clique em "Entrar com Google" → OAuth → callback
  - No callback: verificar se usuário já existe em `users`
  - Se novo usuário: criar `account`, criar registro em `users` com role `admin`, criar as 4 etapas padrão do kanban (Backup → Em Edição → Em Aprovação → Entregue) para a conta, criar registro em `subscriptions` com plano `free`
  - Redirecionar para `/dashboard`
- Middleware Next.js protegendo todas as rotas exceto `/login` e `/invite/[token]`
- Implementar logout

Critério de conclusão: login com Google funcionando, usuário novo cria conta automaticamente com kanban padrão, rotas protegidas, logout funcionando.

---

### FASE 2 — ESTRUTURA VISUAL (design system antes de qualquer tela)

---

#### PASSO 4 — Design System e Componentes Base

> Nunca construir telas sem antes ter os componentes base prontos. Isso evita inconsistência visual.

O que fazer:
- Instalar e configurar fonte Inter (Google Fonts ou `next/font`)
- Criar arquivo `lib/utils.ts` com helper `cn()` (clsx + tailwind-merge)
- Criar componentes base em `components/ui/`:
  - `Button` — variantes: primary, secondary, ghost, danger. Tamanhos: sm, md, lg
  - `Input` — com label, erro e placeholder
  - `Textarea` — com label e erro
  - `Select` — com label e opções
  - `Badge` — variantes de cor pastel para tipo (foto/vídeo) e prazo (normal/próximo/atrasado)
  - `Modal` — overlay escuro + card centralizado + fechar com ESC e clique fora
  - `Card` — container branco com `shadow-sm` e `rounded-xl`
  - `Avatar` — imagem circular com fallback em iniciais
  - `Spinner` — loading indicator
  - `EmptyState` — tela vazia com ícone e CTA
- Definir tokens de design no `tailwind.config.ts`:
  - Cores customizadas baseadas na paleta do documento
  - Breakpoints padrão

Critério de conclusão: todos os componentes criados, visualmente consistentes com o design system definido no documento, sem nenhuma tela funcional ainda.

---

#### PASSO 5 — Layout Base da Aplicação

O que fazer:
- Criar layout principal em `app/(app)/layout.tsx` com:
  - Sidebar esquerda com: logo/nome do produto, itens de navegação (Dashboard, Contatos, Edições), ícone de Configurações no rodapé, avatar do usuário logado
  - Área de conteúdo principal à direita
  - Estados de item ativo na sidebar (highlight com `violet-100` + texto `violet-700`)
- Criar página `/dashboard` com layout correto mas **conteúdo vazio** (só o shell)
- Criar páginas vazias para `/contacts`, `/board`, `/settings` (só o título por enquanto)
- Garantir responsividade básica do layout

Critério de conclusão: sidebar funcionando com navegação entre páginas, visual correto conforme design system, sem dados reais ainda.

---

### FASE 3 — MÓDULOS FUNCIONAIS (um por vez, na ordem)

---

#### PASSO 6 — Módulo Contatos

O que fazer:
- Página `/contacts`:
  - Listagem de contatos da conta (tabela ou cards)
  - Campo de busca por nome ou e-mail
  - Botão "Novo contato"
- Modal "Novo contato" com campos: nome (obrigatório), e-mail (obrigatório), telefone (opcional), observações (opcional)
- Ações em cada contato: editar, excluir
- Ao excluir: verificar se há jobs vinculados — se sim, bloquear com mensagem explicativa
- Validações de formulário (e-mail válido, campos obrigatórios)
- Estado vazio com `EmptyState` component

Critério de conclusão: CRUD completo funcionando com dados reais do Supabase, validações, busca, estado vazio.

---

#### PASSO 7 — Módulo Jobs (listagem e cadastro)

O que fazer:
- Modal / página "Novo job" com todos os campos definidos no documento
- Listagem de jobs (será usada no Dashboard de métricas — passo 10)
- Ao criar job: definir automaticamente `stage_id` como a primeira etapa do kanban da conta (menor `position`)
- Validações de formulário
- Edição de job existente (mesmo modal)
- Exclusão de job com confirmação

Critério de conclusão: criar, editar e excluir jobs funcionando com dados reais, job sempre entra na primeira etapa.

---

#### PASSO 8 — Módulo Kanban (Board principal)

O que fazer:
- Página `/board`:
  - Buscar etapas do kanban da conta ordenadas por `position`
  - Buscar jobs da conta agrupados por `stage_id`
  - Renderizar colunas com fundo pastel correto por posição (conforme tabela de cores do documento)
  - Renderizar cards dos jobs dentro de cada coluna
- Card do job deve mostrar: nome, badge de tipo, badge de prazo (se próximo ou atrasado), nome do contato vinculado (se houver)
- Instalar e configurar **dnd-kit**
- Drag-and-drop de cards entre colunas:
  - Ao soltar: atualizar `stage_id` do job no Supabase
  - Ao mover para a etapa com `is_final = true`: abrir modal de e-mail (componente criado mas envio real só no Passo 11)
- Botão "Novo job" no topo da página

Critério de conclusão: board visual com drag-and-drop funcionando, cores corretas por coluna, badges de prazo, atualização em tempo real no banco.

---

#### PASSO 9 — Configurações do Kanban

O que fazer:
- Seção "Kanban" em `/settings`:
  - Listar etapas atuais da conta com drag-and-drop para reordenar
  - Inline edit para renomear etapa
  - Botão adicionar nova etapa
  - Botão excluir etapa (com aviso se houver jobs nela)
  - Marcar qual etapa é a final (`is_final`) — apenas uma pode ser final
- Aplicar limite por plano:
  - Free: bloquear adição se já tiver 4 etapas, exibir upsell para Pro
  - Pro: sem limite

Critério de conclusão: personalização completa do kanban funcionando, limites de plano aplicados, board reflete as mudanças imediatamente.

---

#### PASSO 10 — Dashboard com Métricas Reais

O que fazer:
- Implementar as 5 métricas com queries reais no Supabase:
  - Total de jobs ativos (stage `is_final = false`)
  - Jobs atrasados (deadline < hoje e is_final = false)
  - Jobs com prazo próximo (deadline entre hoje e +3 dias, is_final = false)
  - Jobs entregues no mês (stage is_final = true, updated_at no mês atual)
  - Jobs a editar este mês (deadline dentro do mês atual)
- Cards de métricas no topo com ícones Lucide
- Lista dos 5 jobs mais urgentes abaixo dos cards (ordenados por deadline asc, não entregues)
- Estado vazio quando não há jobs

Critério de conclusão: todas as métricas mostrando dados reais, atualizando ao criar/mover jobs.

---

### FASE 4 — INTEGRAÇÕES EXTERNAS

---

#### PASSO 11 — Envio de E-mail (Resend)

O que fazer:
- Configurar conta Resend e adicionar domínio
- Criar template de e-mail em HTML responsivo com o template padrão definido no documento
- Implementar modal de envio de e-mail completo:
  - Pré-preencher com: nome do cliente (do contato vinculado), link do material (se preenchido no job), nome do remetente (configurado em Settings → Perfil)
  - Editor de texto livre para o corpo do e-mail
  - Campo de assunto editável
  - Botão enviar + feedback de sucesso/erro
- Criar API route `POST /api/email/send` que chama Resend
- Verificar plano antes de enviar: se Free, bloquear com mensagem de upsell
- Configurar reply-to com e-mail do profissional (de Settings → Perfil)

Critério de conclusão: e-mail chegando na caixa do destinatário, template correto, bloqueio por plano funcionando.

---

#### PASSO 12 — Multi-usuário (Convites e Equipe)

O que fazer:
- Seção "Equipe" em `/settings` (visível apenas para admin):
  - Listar membros ativos da conta (nome, e-mail, role, data de entrada)
  - Botão "Convidar membro"
  - Modal de convite: campo de e-mail + botão enviar convite
  - Remover membro com confirmação
- Criar API route `POST /api/invitations/send`:
  - Gerar token único
  - Salvar convite na tabela `invitations` com `expires_at = now() + 48h`
  - Enviar e-mail de convite via Resend com link `[domínio]/invite/[token]`
- Criar página pública `/invite/[token]`:
  - Validar token (existente, não expirado, não aceito)
  - Exibir tela: "Você foi convidado para [nome da conta]. Entrar com Google."
  - Após login Google: vincular usuário à account, salvar `accepted_at` no convite
- Remover membro: desativar na `account_members`, sem deletar dados
- Verificar plano: funcionalidade disponível apenas no Pro

Critério de conclusão: fluxo completo de convite por e-mail funcionando, membro acessa a mesma conta após login, remoção funciona.

---

#### PASSO 13 — Pagamento e Controle de Planos

O que fazer:

**Asaas:**
- Criar API route `POST /api/payment/card/create` — cria assinatura recorrente no Asaas
- Criar webhook `POST /api/webhooks/asaas` — recebe eventos de pagamento/cancelamento
- Ao confirmar: atualizar `subscriptions` para plano `pro`
- Ao cancelar/inadimplência: atualizar status para `past_due` ou `canceled`

**Cobrança de usuários adicionais:**
- Ao convidar usuário adicional (passo 12): incrementar `extra_users` na subscription e criar cobrança adicional no Asaas

**Página de upgrade:**
- Em Settings → Plano: exibir plano atual, limites, botão "Fazer upgrade para Pro"
- Modal de upgrade: redirecionamento ao checkout Asaas, confirmação

**Aplicar limites em todo o sistema:**
- Jobs: bloquear criação se Free e já tiver 5 ativos
- Contatos: bloquear se Free e já tiver 20
- Etapas Kanban: já feito no Passo 9
- E-mail: já feito no Passo 11
- Usuários adicionais: já feito no Passo 12

Critério de conclusão: upgrade funcional via Asaas, webhook recebendo e atualizando plano, todos os limites do Free aplicados corretamente.

---

### FASE 5 — EXPERIÊNCIA E POLISH

---

#### PASSO 14 — Onboarding Tour (driver.js)

O que fazer:
- Instalar driver.js: `npm install driver.js`
- Criar hook `useOnboardingTour()` que:
  - Verifica se `user.tour_completed === false`
  - Se sim: inicializa e dispara o tour automaticamente após o layout carregar
  - Ao concluir ou pular: chama API para salvar `tour_completed = true` no banco
- Configurar os 6 passos conforme tabela do documento (seção Onboarding Tour)
- Customizar CSS do driver.js para combinar com a paleta do produto (roxo/violet)
- Adicionar opção "Refazer o tour" em Settings → Perfil (reseta `tour_completed = false`)

Critério de conclusão: tour disparando no primeiro login, spotlight funcionando, customizado visualmente, skip e conclusão salvando no banco.

---

#### PASSO 15 — Polish, Responsividade e Edge Cases

O que fazer:
- Revisão visual completa de todas as telas — checar consistência com o design system
- Responsividade: testar e corrigir layout em telas menores (tablet e mobile)
- Loading states: adicionar skeletons ou spinners em todas as operações assíncronas
- Error states: tratar erros de rede, campos inválidos, falhas de API com mensagens amigáveis
- Toasts de feedback: confirmações de ação (job criado, e-mail enviado, etapa reordenada etc.)
- Empty states: garantir que todas as listas tenham estado vazio com orientação ao usuário
- Metadados e SEO básico: título, descrição, favicon
- Testar fluxo completo do zero: novo usuário → login → onboarding → criar contato → criar job → mover no kanban → enviar e-mail → upgrade → convidar membro

Critério de conclusão: produto utilizável do início ao fim sem erros visíveis, visual consistente, feedback em todas as ações.

---

#### PASSO 16 — Deploy em Produção

O que fazer:
- Configurar projeto na Vercel conectado ao repositório GitHub
- Configurar todas as variáveis de ambiente na Vercel (produção)
- Configurar domínio customizado
- Configurar URLs de callback do Google OAuth para o domínio de produção
- Configurar URL de webhook Asaas apontando para produção
- Configurar domínio de e-mail no Resend para produção
- Deploy e smoke test completo em produção: login, criar job, mover kanban, enviar e-mail, webhook de pagamento

Critério de conclusão: produto 100% funcional em produção no domínio final, todos os webhooks recebendo, e-mails chegando.

---

## FORA DO ESCOPO (não implementar sem instrução)

- Portal do cliente (link público de acompanhamento)
- Notificações por WhatsApp
- Relatórios e histórico avançado
- App mobile nativo
- Integração com Google Drive
- Modo escuro
- Automações de lembrete de prazo
