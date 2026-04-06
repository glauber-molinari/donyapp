/**
 * Cliente HTTP para a API Asaas v3.
 * Autenticação: header `access_token` com a API Key (OpenAPI / documentação oficial).
 * @see https://docs.asaas.com/reference (API v3 — header `access_token`)
 */

const DEFAULT_BASE_SANDBOX = "https://api-sandbox.asaas.com";
const DEFAULT_USER_AGENT = "DonyApp/1.0 (Next.js)";

export function getAsaasApiBaseUrl(): string {
  const raw = process.env.ASAAS_API_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return DEFAULT_BASE_SANDBOX;
}

/**
 * Normaliza chave vinda de .env / Vercel: aspas, BOM, barra antes de $
 * (alguns tutoriais sugerem `\$` — na Vercel isso costuma ir literal e quebra o auth).
 */
export function normalizeAsaasApiKey(raw: string | undefined | null): string | null {
  if (raw == null) return null;
  let k = raw.replace(/^\uFEFF/, "").trim();
  if (!k) return null;
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
    k = k.slice(1, -1).trim();
  }
  if (k.startsWith("\\$")) {
    k = k.slice(1);
  }
  return k || null;
}

export function getAsaasApiKey(): string | null {
  return normalizeAsaasApiKey(process.env.ASAAS_API_KEY);
}

/**
 * Chave de produção com URL sandbox (ou o contrário) → Asaas retorna "API inválida".
 */
export function validateAsaasApiEnvMatch(): { ok: true } | { ok: false; error: string } {
  const key = getAsaasApiKey();
  const base = getAsaasApiBaseUrl();
  if (!key) {
    return { ok: false, error: "ASAAS_API_KEY não configurada." };
  }
  const isSandboxHost = base.includes("sandbox");
  const looksProdKey = key.includes("$aact_prod") || key.includes("_prod_");
  const looksSandboxKey = key.includes("$aact_hmlg") || key.includes("_hmlg_");
  if (isSandboxHost && looksProdKey) {
    return {
      ok: false,
      error:
        "Configuração Asaas: URL é sandbox, mas a chave parece ser de produção. Na Vercel, defina ASAAS_API_URL=https://api.asaas.com (sem sandbox) e faça redeploy.",
    };
  }
  if (!isSandboxHost && looksSandboxKey) {
    return {
      ok: false,
      error:
        "Configuração Asaas: URL é produção, mas a chave parece ser de sandbox (hmlg). Use uma chave $aact_prod na produção ou aponte ASAAS_API_URL para https://api-sandbox.asaas.com.",
    };
  }
  return { ok: true };
}

export function asaasHeaders(): Record<string, string> {
  const key = getAsaasApiKey();
  if (!key) {
    throw new Error("ASAAS_API_KEY não configurada.");
  }
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": process.env.ASAAS_USER_AGENT?.trim() || DEFAULT_USER_AGENT,
    access_token: key,
  };
}

export type AsaasErrorResponse = {
  errors?: Array<{ code?: string; description?: string }>;
};

export async function asaasPostJson<TResponse extends object>(
  path: string,
  body: unknown
): Promise<{ ok: boolean; status: number; json: TResponse & AsaasErrorResponse }> {
  const base = getAsaasApiBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: asaasHeaders(),
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as TResponse & AsaasErrorResponse;
  return { ok: res.ok, status: res.status, json };
}
