import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isProtectedAppPath } from "@/lib/agent/protected-routes";
import type { Database } from "@/types/database";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => {
    to.cookies.set(c.name, c.value);
  });
}

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const oauthCode = request.nextUrl.searchParams.get("code");

  // Galerias fora do ar: APIs públicas não servem mais fotos nem aceitam senha/seleção.
  if (path.startsWith("/api/gallery")) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  /**
   * OAuth PKCE: se o redirect permitido no Supabase não incluir `/auth/callback`,
   * o retorno pode cair na Site URL (`/`) ou em `/login` com `?code=…` sem trocar sessão.
   * Encaminha para o route handler que faz `exchangeCodeForSession`.
   */
  if (oauthCode && (path === "/" || path === "/login")) {
    const target = new URL("/auth/callback", request.url);
    request.nextUrl.searchParams.forEach((value, key) => {
      target.searchParams.set(key, value);
    });
    return NextResponse.redirect(target);
  }

  let response = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("Supabase: NEXT_PUBLIC_SUPABASE_URL / ANON_KEY ausentes");
    return response;
  }

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /**
   * Only known app surfaces require auth. Unknown paths must reach Next.js
   * `not-found` (real HTTP 404) instead of soft-404 via /login.
   */
  if (!user && isProtectedAppPath(path)) {
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    copyCookies(response, redirect);
    return redirect;
  }

  // Redireciona usuários autenticados que tentam acessar páginas de autenticação pública.
  const isAuthPage =
    path === "/login" || path === "/signup" || path === "/forgot-password";
  if (user && isAuthPage) {
    const next = request.nextUrl.searchParams.get("next");
    if (next?.startsWith("/invite/")) {
      return response;
    }
    const redirect = NextResponse.redirect(new URL("/dashboard", request.url));
    copyCookies(response, redirect);
    return redirect;
  }

  return response;
}
