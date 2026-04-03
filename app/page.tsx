/**
 * A raiz "/" é redirecionada no middleware (login ou dashboard).
 * Este conteúdo só aparece se o middleware for desativado.
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-[#F0F4F3] p-6">
      <p className="text-sm text-gray-500">Carregando…</p>
    </div>
  );
}
