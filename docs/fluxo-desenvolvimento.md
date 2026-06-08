# Fluxo de desenvolvimento — features em paralelo sem arriscar a produção

Objetivo: tocar várias features ao mesmo tempo, cada uma com URL de preview
isolada, podendo até mergear na `master` "no escuro" (escondida atrás de flag),
e ligar em produção só quando estiver pronta — sem deploy destrutivo.

Contexto da stack: **um único projeto Supabase** (sem banco de staging) e Vercel
ligada ao GitHub (push na `master` = deploy de produção). Por isso a proteção
vem de **feature flags + disciplina de migrations**, não de bancos separados.

## O ciclo de uma feature

```
git checkout -b feat/nome-da-feature
# ...desenvolve...
git push -u origin feat/nome-da-feature   # Vercel cria um Preview URL isolado
gh pr create --fill                       # abre o PR
# valida no Preview URL → merge na master → produção
```

1. **Branch.** Nunca commite direto na `master` (ela está protegida; exige PR).
   Cada branch vira um deploy de preview isolado na Vercel automaticamente.
2. **Flag.** Toda UI/rota nova nasce escondida atrás de uma feature flag (ver
   abaixo). Assim ela pode ir pra `master`/produção sem aparecer pro usuário.
3. **Migration aditiva.** Mudança de banco só aditiva e retrocompatível.
4. **PR + Preview.** Revise no Preview URL antes de mergear.
5. **Promover.** Com a feature pronta, ligue a flag em produção.

## Feature flags

Dois mecanismos, em [lib/feature-flags.ts](../lib/feature-flags.ts) e
[lib/feature-flags.server.ts](../lib/feature-flags.server.ts):

| | ENV (`NEXT_PUBLIC_FF_*`) | Banco (`feature_flags`) |
|---|---|---|
| Onde liga | Vercel → Env Vars (escopo Preview/Production) | tabela `feature_flags` |
| Muda em runtime? | Não (exige redeploy) | **Sim, sem redeploy** |
| Bom para | "ligado em todo preview, off em prod" | rollout / kill switch em prod |

Resolução no servidor (`isFeatureEnabled`): **banco → ENV → false**.

Registrar uma flag nova em `FEATURE_FLAGS` (`lib/feature-flags.ts`) e espelhar
o default de client em `CLIENT_ENV_FLAGS` (acesso estático a `process.env` é
obrigatório para o Next embutir no bundle do client).

```ts
// Server Component / Server Action
import { isFeatureEnabled } from "@/lib/feature-flags.server";
if (await isFeatureEnabled("demo")) { /* mostra a feature */ }

// Client Component (só ENV)
import { isFeatureEnabledFromEnv } from "@/lib/feature-flags";
if (isFeatureEnabledFromEnv("demo")) { /* ... */ }
```

Ligar em produção sem deploy (SQL Editor do Supabase):
```sql
insert into feature_flags (key, enabled) values ('demo', true)
  on conflict (key) do update set enabled = true, updated_at = now();
```

Gating **por conta** (liberar só p/ alguns clientes): use coluna dedicada em
`accounts` (padrão do `accounts.album_board_enabled`), não a flag global.

## Disciplina de migrations (banco único!)

- Só **aditivas e retrocompatíveis** enquanto a feature não é GA: `ADD COLUMN`
  com `DEFAULT`/`NULL`, nova tabela, índice.
- **Nunca** `DROP`/`RENAME`/`NOT NULL` sem default num passo só — quebra a
  versão de produção que ainda não conhece a coluna.
- Limpeza destrutiva só **depois** da feature 100% no ar.
- Aplicar via Supabase MCP / dashboard e regenerar `types/database.ts`.

## Serviços externos nos previews

- **Asaas:** chave sandbox (`$aact_hmlg_…`) + `ASAAS_API_URL=https://api-sandbox.asaas.com` no escopo Preview.
- **Resend:** `RESEND_FROM`/`TEAM_NOTIFY_EMAIL` de teste no Preview p/ não mandar e-mail real a clientes.
- **Webhooks (Asaas):** apontar para o Preview URL só quando for testar pagamento.

## Rodar duas features ao mesmo tempo no PC (opcional)

```bash
git worktree add ../donyapp-feat-x feat/x   # uma pasta por branch, mesmo repo
```

## Configuração já aplicada

- `master` protegida no GitHub (exige PR; `enforce_admins` off = dono ainda tem escape hatch).
- Tabela `feature_flags` criada (migration `20260603120000_feature_flags.sql`).

### Pendente (cliques no painel da Vercel)

- **Settings → Git → Production Branch = `master`** (garantir que só ela publica).
- **Settings → Environment Variables:** ao criar `NEXT_PUBLIC_FF_*`, marcar só
  o escopo **Preview** (e/ou Development) até promover para Production.
