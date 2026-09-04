/** Machine-readable OAuth scopes for the public Agent API. */

export const API_SCOPES = {
  "product:read": "Read public product, features, and pricing catalog",
  "profile:read": "Read the authenticated user's profile summary",
  "account:read": "Read the authenticated user's studio account summary",
} as const;

export type ApiScope = keyof typeof API_SCOPES;

export const ALL_API_SCOPES = Object.keys(API_SCOPES) as ApiScope[];

export const DEFAULT_AUTH_SCOPES: ApiScope[] = ["profile:read", "account:read"];

export function parseScopes(raw: string | null | undefined): ApiScope[] {
  if (!raw?.trim()) return [...DEFAULT_AUTH_SCOPES];
  const wanted = new Set(
    raw
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean),
  );
  return ALL_API_SCOPES.filter((s) => wanted.has(s));
}

export function scopesToString(scopes: readonly string[]): string {
  return scopes.join(" ");
}

export function hasScope(
  granted: readonly string[] | undefined,
  required: ApiScope,
): boolean {
  return Boolean(granted?.includes(required));
}
