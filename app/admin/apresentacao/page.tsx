import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { isPlatformAdminEmail } from "@/lib/admin/platform-admin";
import { createClient } from "@/lib/supabase/server";
import { PresentationView } from "./presentation-view";

export const metadata: Metadata = {
  title: "Apresentação Dony | Admin",
  robots: { index: false, follow: false },
};

export default async function PresentationPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isPlatformAdminEmail(user.email)) {
    redirect("/dashboard");
  }

  return <PresentationView />;
}
