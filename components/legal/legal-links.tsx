import Link from "next/link";

import { cn } from "@/lib/utils";

export function LegalLinks({
  className,
  linkClassName,
}: {
  className?: string;
  linkClassName?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-x-4 gap-y-1", className)}>
      <Link
        href="/termos-de-servico"
        className={cn("underline-offset-4 hover:underline", linkClassName)}
      >
        Termos de Serviço
      </Link>
      <Link
        href="/politica-de-privacidade"
        className={cn("underline-offset-4 hover:underline", linkClassName)}
      >
        Política de Privacidade
      </Link>
    </div>
  );
}

