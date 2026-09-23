/**
 * Cliente HTTP para a API AbacatePay v2.
 * @see https://docs.abacatepay.com/pages/authentication
 */

const DEFAULT_BASE = "https://api.abacatepay.com/v2";

export function getAbacatePayApiBaseUrl(): string {
  const raw = process.env.ABACATEPAY_API_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return DEFAULT_BASE;
}

export function getAbacatePayApiKey(): string | null {
  const raw = process.env.ABACATEPAY_API_KEY?.trim();
  if (!raw) return null;
  let k = raw.replace(/^\uFEFF/, "").trim();
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
    k = k.slice(1, -1).trim();
  }
  return k || null;
}

export function validateAbacatePayApiEnv(): { ok: true } | { ok: false; error: string } {
  if (!getAbacatePayApiKey()) {
    return { ok: false, error: "ABACATEPAY_API_KEY não configurada." };
  }
  return { ok: true };
}

export function abacatePayHeaders(): Record<string, string> {
  const key = getAbacatePayApiKey();
  if (!key) {
    throw new Error("ABACATEPAY_API_KEY não configurada.");
  }
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${key}`,
  };
}

export type AbacatePayEnvelope<T> = {
  data?: T | null;
  error?: string | null;
  success?: boolean;
};

export async function abacatePayPostJson<TResponse>(
  path: string,
  body: unknown
): Promise<{ ok: boolean; status: number; json: AbacatePayEnvelope<TResponse> }> {
  const base = getAbacatePayApiBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: abacatePayHeaders(),
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as AbacatePayEnvelope<TResponse>;
  const ok = res.ok && json.success !== false && !json.error;
  return { ok, status: res.status, json };
}
