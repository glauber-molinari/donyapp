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

export function getAsaasApiKey(): string | null {
  const k = process.env.ASAAS_API_KEY?.trim();
  return k || null;
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
