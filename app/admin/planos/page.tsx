import { AdminAccountsTable } from "@/components/admin/admin-accounts-table";
import { fetchAdminAccountsWithSubscriptions } from "@/lib/admin/accounts";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { Input } from "@/components/ui/input";

export default async function AdminPlanosPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const svc = createServiceRoleClient();
  if (!svc) {
    return (
      <div className="rounded-ds-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        Configure <code className="rounded bg-white/60 px-1">SUPABASE_SERVICE_ROLE_KEY</code> para
        listar contas.
      </div>
    );
  }

  const q = searchParams.q?.trim() ?? "";
  const accounts = await fetchAdminAccountsWithSubscriptions(svc, { search: q || undefined });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-ds-ink">Planos e contas</h2>
        <p className="mt-1 text-sm text-ds-muted">
          Conceda Pro cortesia (sem Asaas) ou reverta para Free. Lista até 400 contas mais recentes.
        </p>
      </div>

      <form className="flex max-w-md flex-col gap-2 sm:flex-row sm:items-end" method="get">
        <label className="flex flex-1 flex-col gap-1 text-sm text-ds-muted">
          Buscar por nome da conta
          <Input
            id="admin-search-q"
            type="search"
            name="q"
            placeholder="Nome do estúdio"
            defaultValue={q}
            className="bg-app-sidebar"
          />
        </label>
        <button
          type="submit"
          className="h-10 shrink-0 rounded-ds-xl bg-app-primary px-4 text-sm font-medium text-white hover:brightness-95"
        >
          Buscar
        </button>
      </form>

      <AdminAccountsTable accounts={accounts} />
    </div>
  );
}
