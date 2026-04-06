import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Serviço",
  description: "Regras de uso do Donyapp e condições para acesso ao produto.",
};

const UPDATED_AT = "06/04/2026";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-ds-cream text-ds-ink">
      <header className="border-b border-ds-border bg-ds-cream/70 supports-[backdrop-filter]:backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold text-ds-ink hover:opacity-80">
            Donyapp
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/politica-de-privacidade" className="text-ds-muted hover:text-ds-ink">
              Privacidade
            </Link>
            <Link href="/login" className="font-semibold text-ds-ink hover:opacity-80">
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
          Termos de Serviço
        </h1>
        <p className="mt-3 text-sm text-ds-subtle">Atualizado em {UPDATED_AT}.</p>

        <div className="mt-10 space-y-10">
          <section className="space-y-3">
            <h2 className="text-xl font-bold">1. Aceite</h2>
            <p className="text-sm leading-relaxed text-ds-muted">
              Ao acessar o site ou usar o Donyapp (“Serviço”), você concorda com estes Termos e com a
              nossa{" "}
              <Link href="/politica-de-privacidade" className="font-semibold text-ds-ink hover:underline">
                Política de Privacidade
              </Link>
              . Se você estiver usando em nome de um estúdio/empresa, declara ter poderes para
              aceitar em nome dessa entidade.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">2. Descrição do Serviço</h2>
            <p className="text-sm leading-relaxed text-ds-muted">
              O Donyapp é uma ferramenta de organização de pós-produção (ex.: kanban, prazos, contatos
              e colaboração). Recursos podem mudar ao longo do tempo, inclusive por motivos técnicos,
              segurança e evolução do produto.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">3. Conta, acesso e segurança</h2>
            <div className="space-y-3 text-sm leading-relaxed text-ds-muted">
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  O login é realizado via Conta Google. Você é responsável por manter a segurança da
                  sua conta e dispositivo.
                </li>
                <li>
                  Você deve fornecer informações verdadeiras e manter dados atualizados quando
                  aplicável.
                </li>
                <li>
                  Podemos suspender acessos em caso de suspeita de uso indevido, fraude, ataque ou
                  violação destes Termos.
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">4. Uso aceitável</h2>
            <div className="space-y-3 text-sm leading-relaxed text-ds-muted">
              <p>Você concorda em não:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Usar o Serviço para fins ilegais, abusivos ou que violem direitos de terceiros.</li>
                <li>Tentar acessar áreas restritas, sistemas ou dados sem autorização.</li>
                <li>
                  Interferir no funcionamento (ex.: ataques, sobrecarga, scraping agressivo, malware).
                </li>
                <li>Compartilhar convites, links ou acessos fora das regras da sua equipe.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">5. Conteúdo do usuário</h2>
            <div className="space-y-3 text-sm leading-relaxed text-ds-muted">
              <p>
                Você mantém a titularidade do conteúdo que inserir no Donyapp (ex.: dados de clientes,
                descrições e prazos). Você concede uma licença limitada para hospedarmos e processarmos
                esse conteúdo apenas para fornecer o Serviço.
              </p>
              <p>
                Você é responsável por obter autorizações necessárias para tratar dados de terceiros
                (ex.: seus clientes) no app.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">6. Planos, pagamentos e testes</h2>
            <p className="text-sm leading-relaxed text-ds-muted">
              O Donyapp pode oferecer plano gratuito e planos pagos. Condições (preço, limites,
              renovação e cancelamento) podem ser apresentadas dentro do app e podem mudar. Se houver
              provedor de pagamento, ele poderá aplicar termos próprios para processamento.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">7. Disponibilidade e suporte</h2>
            <p className="text-sm leading-relaxed text-ds-muted">
              Buscamos manter o Serviço disponível, mas não garantimos operação ininterrupta. Podem
              ocorrer manutenções, falhas de terceiros, limites técnicos e eventos fora do nosso
              controle. Suporte pode ser oferecido pelos canais oficiais informados no app e/ou pelo
              e-mail <span className="font-semibold text-ds-ink">suporte@donyapp.com</span>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">8. Propriedade intelectual</h2>
            <p className="text-sm leading-relaxed text-ds-muted">
              O Donyapp, sua marca, layout, componentes e software são protegidos por direitos de
              propriedade intelectual. Estes Termos não transferem direitos sobre o Serviço para
              você.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">9. Limitação de responsabilidade</h2>
            <p className="text-sm leading-relaxed text-ds-muted">
              Na máxima extensão permitida pela lei, não nos responsabilizamos por perdas indiretas,
              lucros cessantes, perda de dados decorrentes de uso indevido, falhas de terceiros ou
              indisponibilidades. Você é responsável por manter backups e por revisar prazos e
              entregas conforme seu processo.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">10. Suspensão, cancelamento e encerramento</h2>
            <p className="text-sm leading-relaxed text-ds-muted">
              Você pode deixar de usar o Serviço a qualquer momento. Podemos suspender ou encerrar
              contas em caso de violação destes Termos, risco de segurança ou exigência legal. Quando
              aplicável, regras de retenção/exclusão são descritas na Política de Privacidade.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">11. Alterações nos Termos</h2>
            <p className="text-sm leading-relaxed text-ds-muted">
              Podemos atualizar estes Termos. Mudanças relevantes serão comunicadas pelo site/app. A
              data de atualização no topo indica a versão vigente.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">12. Contato</h2>
            <p className="text-sm leading-relaxed text-ds-muted">
              Para dúvidas sobre estes Termos, contate{" "}
              <span className="font-semibold text-ds-ink">suporte@donyapp.com</span> ou os canais
              oficiais divulgados no app.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

