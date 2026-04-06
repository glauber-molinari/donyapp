import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como o Donyapp trata dados pessoais e informações do uso do produto.",
};

const UPDATED_AT = "06/04/2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-ds-cream text-ds-ink">
      <header className="border-b border-ds-border bg-ds-cream/70 supports-[backdrop-filter]:backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold text-ds-ink hover:opacity-80">
            Donyapp
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/termos-de-servico" className="text-ds-muted hover:text-ds-ink">
              Termos
            </Link>
            <Link href="/login" className="font-semibold text-ds-ink hover:opacity-80">
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
          Política de Privacidade
        </h1>
        <p className="mt-3 text-sm text-ds-subtle">Atualizado em {UPDATED_AT}.</p>

        <div className="mt-10 space-y-10">
          <section className="space-y-3">
            <h2 className="text-xl font-bold">1. Sobre esta Política</h2>
            <p className="text-sm leading-relaxed text-ds-muted">
              Esta Política descreve como o Donyapp (“nós”) coleta, usa, armazena e compartilha dados
              pessoais quando você acessa o site, cria conta e usa o produto de gestão de pós-produção
              (o “Serviço”). Ela foi preparada em linguagem direta, mas não substitui aconselhamento
              jurídico.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">2. Quais dados coletamos</h2>
            <div className="space-y-3 text-sm leading-relaxed text-ds-muted">
              <p>
                O Donyapp pode tratar as seguintes categorias de dados, conforme o uso do Serviço:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <span className="font-semibold text-ds-ink">Dados de conta</span>: nome, e-mail,
                  foto de perfil e identificadores vinculados ao login via Google.
                </li>
                <li>
                  <span className="font-semibold text-ds-ink">Dados do seu workspace</span>: nomes
                  de equipe/estúdio, membros, permissões, configurações e preferências.
                </li>
                <li>
                  <span className="font-semibold text-ds-ink">Conteúdo do usuário</span>: informações
                  cadastradas por você no app (ex.: contatos de clientes, cards, prazos, descrições,
                  observações).
                </li>
                <li>
                  <span className="font-semibold text-ds-ink">Dados de uso e diagnóstico</span>:
                  eventos técnicos necessários para operar e proteger o Serviço (ex.: logs de acesso,
                  IP, tipo de navegador, datas/horários, páginas e ações).
                </li>
                <li>
                  <span className="font-semibold text-ds-ink">Cobrança e plano</span>: quando
                  aplicável, dados relacionados a pagamento/assinatura (ex.: status do plano, id de
                  cobrança). Dados sensíveis de cartão normalmente são processados pelo provedor de
                  pagamento, não por nós.
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">3. Como usamos os dados</h2>
            <div className="space-y-3 text-sm leading-relaxed text-ds-muted">
              <p>Usamos dados pessoais para:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Fornecer o Serviço (criar conta, autenticar, manter sessão e operar recursos).</li>
                <li>Permitir colaboração (times, convites, permissões e compartilhamento interno).</li>
                <li>Melhorar e manter o produto (correções, desempenho, prevenção de abuso).</li>
                <li>Cumprir obrigações legais e responder a solicitações legítimas.</li>
                <li>Comunicar avisos importantes sobre o Serviço (segurança, mudanças relevantes).</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">4. Bases legais (LGPD)</h2>
            <div className="space-y-3 text-sm leading-relaxed text-ds-muted">
              <p>
                Dependendo do caso, o tratamento ocorre com base em: execução de contrato (fornecer o
                Serviço), legítimo interesse (segurança, prevenção de fraude, melhoria), cumprimento
                de obrigação legal/regulatória e consentimento (quando aplicável).
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">5. Compartilhamento de dados</h2>
            <div className="space-y-3 text-sm leading-relaxed text-ds-muted">
              <p>
                Podemos compartilhar dados com provedores que operam partes do Serviço (por exemplo:
                hospedagem/infra, autenticação, banco de dados, e-mail transacional, pagamentos),
                sempre na medida necessária para prestar o Serviço.
              </p>
              <p>
                Também podemos compartilhar informações quando exigido por lei, ordem judicial ou
                para proteger direitos e segurança do Serviço e de terceiros.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">6. Cookies e tecnologias similares</h2>
            <p className="text-sm leading-relaxed text-ds-muted">
              Usamos cookies e armazenamento local para manter sua sessão, lembrar preferências e
              melhorar a experiência. Você pode gerenciar cookies no seu navegador; algumas funções
              podem deixar de funcionar se forem bloqueados.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">7. Retenção e exclusão</h2>
            <p className="text-sm leading-relaxed text-ds-muted">
              Mantemos dados pelo tempo necessário para fornecer o Serviço e cumprir obrigações
              legais. Quando possível, você pode solicitar exclusão de conta e/ou dados. Em alguns
              casos, pode haver retenção mínima por requisitos legais, prevenção de fraude e
              auditoria.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">8. Segurança</h2>
            <p className="text-sm leading-relaxed text-ds-muted">
              Adotamos medidas técnicas e organizacionais para proteger os dados (ex.: controle de
              acesso, criptografia em trânsito, segregação de ambientes). Mesmo assim, nenhum sistema
              é 100% infalível; por isso, recomendamos proteger suas credenciais e dispositivo.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">9. Direitos do titular</h2>
            <div className="space-y-3 text-sm leading-relaxed text-ds-muted">
              <p>
                Você pode solicitar: confirmação e acesso, correção, anonimização, portabilidade,
                eliminação, informação sobre compartilhamento e revisão de decisões automatizadas
                (quando aplicável), conforme a LGPD.
              </p>
              <p>
                Para exercer direitos, entre em contato pelos canais oficiais divulgados no app ou
                pelo e-mail <span className="font-semibold text-ds-ink">suporte@donyapp.com</span>.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">10. Crianças e adolescentes</h2>
            <p className="text-sm leading-relaxed text-ds-muted">
              O Serviço não é direcionado a menores de 18 anos. Se você acredita que dados de menores
              foram tratados indevidamente, contate o suporte.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">11. Alterações desta Política</h2>
            <p className="text-sm leading-relaxed text-ds-muted">
              Podemos atualizar esta Política periodicamente. Quando houver mudanças relevantes,
              iremos comunicar pelo site/app. A data de atualização no topo indica a versão vigente.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

