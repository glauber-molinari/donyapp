import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DesignSystemLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <div className={jetbrainsMono.variable}>{children}</div>;
}
