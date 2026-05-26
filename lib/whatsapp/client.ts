const ZAPI_BASE = process.env.ZAPI_BASE_URL ?? "https://api.z-api.io";

interface SendResult {
  ok: boolean;
  error?: string;
}

interface StatusResult {
  connected: boolean;
  phone?: string;
}

interface QrCodeResult {
  ok: boolean;
  connected?: boolean;
  qrBase64?: string;
  error?: string;
}

function buildHeaders(clientToken?: string): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const ct = clientToken ?? process.env.ZAPI_CLIENT_TOKEN;
  if (ct) headers["Client-Token"] = ct;
  return headers;
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return `55${digits}`;
}

export async function sendWhatsAppText(
  phone: string,
  message: string,
  instanceId?: string,
  token?: string
): Promise<SendResult> {
  const iid = instanceId ?? process.env.ZAPI_INSTANCE_ID;
  const tok = token ?? process.env.ZAPI_TOKEN;

  if (!iid || !tok) return { ok: false, error: "Z-API não configurada." };

  const url = `${ZAPI_BASE}/instances/${iid}/token/${tok}/send-text`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ phone: formatPhone(phone), message }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      return { ok: false, error: `Z-API ${res.status}: ${text}` };
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function getInstanceStatus(
  instanceId: string,
  token: string
): Promise<StatusResult> {
  const url = `${ZAPI_BASE}/instances/${instanceId}/token/${token}/status`;

  try {
    const res = await fetch(url, { headers: buildHeaders() });
    if (!res.ok) return { connected: false };
    const data = await res.json();
    return { connected: data.connected === true, phone: data.phone };
  } catch {
    return { connected: false };
  }
}

export async function getQrCode(
  instanceId: string,
  token: string
): Promise<QrCodeResult> {
  const url = `${ZAPI_BASE}/instances/${instanceId}/token/${token}/qr-code/image`;

  try {
    const res = await fetch(url, {
      headers: { ...(process.env.ZAPI_CLIENT_TOKEN ? { "Client-Token": process.env.ZAPI_CLIENT_TOKEN } : {}) },
    });

    if (!res.ok) return { ok: false, error: `QR code erro ${res.status}` };

    const contentType = res.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const data = await res.json();
      if (data.connected) return { ok: true, connected: true };
      return { ok: true, qrBase64: data.value ?? data.qrCode ?? data.base64 };
    }

    // Binary image — convert to base64
    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    return { ok: true, qrBase64: `data:image/png;base64,${base64}` };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function disconnectInstance(
  instanceId: string,
  token: string
): Promise<boolean> {
  const url = `${ZAPI_BASE}/instances/${instanceId}/token/${token}/disconnect`;

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: buildHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function isPlatformConfigured(): boolean {
  return Boolean(process.env.ZAPI_INSTANCE_ID && process.env.ZAPI_TOKEN);
}
