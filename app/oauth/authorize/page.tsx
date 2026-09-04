import Link from "next/link";
import { redirect } from "next/navigation";

import { API_SCOPES, parseScopes } from "@/lib/agent/api/scopes";
import { getClient, isRedirectUriAllowed } from "@/lib/agent/api/oauth-store";
import { SITE_NAME } from "@/lib/agent/site";
import { createClient } from "@/lib/supabase/server";

import { approveOAuthConsent } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

export default async function OAuthAuthorizePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const responseType = first(searchParams.response_type);
  const clientId = first(searchParams.client_id);
  const redirectUri = first(searchParams.redirect_uri);
  const scope = first(searchParams.scope);
  const state = first(searchParams.state);
  const codeChallenge = first(searchParams.code_challenge);
  const codeChallengeMethod = first(searchParams.code_challenge_method) || "S256";
  const error = first(searchParams.error);

  if (error) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-ds-ink">
        <h1 className="text-2xl font-semibold">Não foi possível autorizar</h1>
        <p className="mt-3 text-ds-muted">{error}</p>
        <p className="mt-6">
          <Link href="/" className="underline">
            Voltar ao início
          </Link>
        </p>
      </main>
    );
  }

  if (responseType !== "code") {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-2xl font-semibold">Pedido OAuth inválido</h1>
        <p className="mt-3 text-ds-muted">Só suportamos response_type=code.</p>
      </main>
    );
  }

  if (!clientId || !redirectUri || !codeChallenge) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-2xl font-semibold">Pedido OAuth incompleto</h1>
        <p className="mt-3 text-ds-muted">
          client_id, redirect_uri e code_challenge (S256) são obrigatórios.
        </p>
      </main>
    );
  }

  if (codeChallengeMethod !== "S256") {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-2xl font-semibold">PKCE inválido</h1>
        <p className="mt-3 text-ds-muted">Use code_challenge_method=S256.</p>
      </main>
    );
  }

  let client;
  try {
    client = await getClient(clientId);
  } catch {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-2xl font-semibold">OAuth indisponível</h1>
        <p className="mt-3 text-ds-muted">
          O servidor de autorização não conseguiu ler o cadastro de clientes. Tente de novo em
          alguns minutos.
        </p>
      </main>
    );
  }

  if (!client || !isRedirectUriAllowed(client, redirectUri)) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-2xl font-semibold">Cliente inválido</h1>
        <p className="mt-3 text-ds-muted">
          client_id desconhecido ou redirect_uri não cadastrado. Registre o app em{" "}
          <code className="text-sm">POST /oauth/register</code>.
        </p>
      </main>
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = `/oauth/authorize?${new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    }).toString()}`;
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const scopes = parseScopes(scope);
  const appName = client.client_name?.trim() || client.client_id;

  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-ds-ink">
      <p className="text-sm text-ds-muted">{SITE_NAME} · autorização de API</p>
      <h1 className="mt-2 text-2xl font-semibold">Permitir acesso?</h1>
      <p className="mt-3 text-ds-muted">
        O app <strong className="text-ds-ink">{appName}</strong> pede permissão para agir em nome
        da sua conta, só nos escopos abaixo. Dados de clientes e jobs do kanban não entram nesses
        escopos.
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-5 text-sm">
        {scopes.map((s) => (
          <li key={s}>
            <code>{s}</code> — {API_SCOPES[s]}
          </li>
        ))}
      </ul>
      <form action={approveOAuthConsent} className="mt-8 flex flex-wrap gap-3">
        <input type="hidden" name="client_id" value={clientId} />
        <input type="hidden" name="redirect_uri" value={redirectUri} />
        <input type="hidden" name="scope" value={scopes.join(" ")} />
        <input type="hidden" name="state" value={state} />
        <input type="hidden" name="code_challenge" value={codeChallenge} />
        <button
          type="submit"
          name="decision"
          value="allow"
          className="rounded-md bg-ds-ink px-4 py-2 text-sm font-medium text-white"
        >
          Permitir
        </button>
        <button
          type="submit"
          name="decision"
          value="deny"
          className="rounded-md border border-ds-border px-4 py-2 text-sm"
        >
          Negar
        </button>
      </form>
      <p className="mt-8 text-xs text-ds-muted">
        Logado como {user.email ?? user.id}.{" "}
        <Link href="/auth.md" className="underline">
          Como autenticar agentes
        </Link>
      </p>
    </main>
  );
}
