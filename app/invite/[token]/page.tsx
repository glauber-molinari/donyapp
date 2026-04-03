/**
 * Página pública de convite (PASSO 12 preencherá o fluxo).
 * Mantida agora para a rota existir e o middleware liberar sem sessão.
 */
export default function InvitePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F0F4F3] px-4">
      <div className="max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Convite para equipe</h1>
        <p className="mt-2 text-sm text-gray-500">
          O fluxo de aceite por token será implementado no módulo multi-usuário.
        </p>
      </div>
    </div>
  );
}
