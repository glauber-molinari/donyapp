import { createHmac, timingSafeEqual } from "crypto";

export type GoogleCalendarOAuthStatePayload = {
  accountId: string;
  userId: string;
  exp: number;
};

function stateSecret(): string | null {
  const s = process.env.GOOGLE_CALENDAR_OAUTH_STATE_SECRET?.trim();
  if (!s || s.length < 16) return null;
  return s;
}

export function assertGoogleCalendarOAuthConfigured(): void {
  if (!stateSecret()) {
    throw new Error(
      "GOOGLE_CALENDAR_OAUTH_STATE_SECRET ausente ou fraco (mín. 16 caracteres)."
    );
  }
}

/** Assina payload para CSRF no fluxo OAuth (callback valida HMAC + exp + userId). */
export function signGoogleCalendarOAuthState(payload: GoogleCalendarOAuthStatePayload): string {
  const secret = stateSecret();
  if (!secret) {
    throw new Error("GOOGLE_CALENDAR_OAUTH_STATE_SECRET não configurado.");
  }
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyGoogleCalendarOAuthState(
  state: string
): GoogleCalendarOAuthStatePayload | null {
  const secret = stateSecret();
  if (!secret || !state) return null;
  const dot = state.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = state.slice(0, dot);
  const sig = state.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const sigBuf = Buffer.from(sig, "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expBuf.length) return null;
  try {
    if (!timingSafeEqual(sigBuf, expBuf)) return null;
  } catch {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const o = parsed as Record<string, unknown>;
  if (
    typeof o.accountId !== "string" ||
    typeof o.userId !== "string" ||
    typeof o.exp !== "number"
  ) {
    return null;
  }
  if (o.exp < Date.now()) return null;
  return { accountId: o.accountId, userId: o.userId, exp: o.exp };
}
