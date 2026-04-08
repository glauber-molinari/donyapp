import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { publicAppOrigin } from "@/lib/app-url";
import type { Database } from "@/types/database";

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const appBase = publicAppOrigin(request);

  if (!url || !key) {
    return NextResponse.redirect(`${appBase}/login`, { status: 303 });
  }

  let response = NextResponse.redirect(`${appBase}/login`, { status: 303 });

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        response = NextResponse.redirect(`${appBase}/login`, { status: 303 });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.signOut();

  return response;
}
