import { readFile } from "fs/promises";
import path from "path";

import { NextRequest, NextResponse } from "next/server";

import { applyWatermark } from "@/lib/gallery/watermark";
import { fetchWatermarkLogoBuffer } from "@/lib/gallery/watermark-resolve";
import { createClient } from "@/lib/supabase/server";
import type { WatermarkConfig } from "@/types/gallery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseConfig(searchParams: URLSearchParams): WatermarkConfig {
  const opacity = Number(searchParams.get("opacity"));
  const scale = Number(searchParams.get("scale"));
  const rotation = Number(searchParams.get("rotation"));
  return {
    opacity: Number.isFinite(opacity) ? opacity : 40,
    scale: Number.isFinite(scale) ? scale : 20,
    rotation: Number.isFinite(rotation) ? rotation : -30,
  };
}

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("account_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.account_id) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const { data: account } = await supabase
    .from("accounts")
    .select("watermark_logo_url")
    .eq("id", profile.account_id)
    .maybeSingle();

  const config = parseConfig(request.nextUrl.searchParams);
  const samplePath = path.join(process.cwd(), "public/brand/exemplo-marca.jpg");
  const original = await readFile(samplePath);
  const logoBuffer = await fetchWatermarkLogoBuffer(account?.watermark_logo_url);
  const watermarked = await applyWatermark(original, config, logoBuffer);

  return new NextResponse(new Uint8Array(watermarked), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "no-store",
    },
  });
}
