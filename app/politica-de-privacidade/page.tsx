import type { Metadata } from "next";
import Link from "next/link";

import { canonicalSiteUrl } from "@/lib/agent/site";

const canonical = `${canonicalSiteUrl()}/politica-de-privacidade`;

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como o Dony.app trata dados pessoais e informações do uso do produto.",
  alternates: { canonical },
  openGraph: {
    type: "website",
    url: canonical,
    title: "Política de Privacidade — Dony.app",
    description: "Como o Dony.app trata dados pessoais, inclusive dados da Conta Google e do Google Calendar.",
  },
};

const UPDATED_AT = "23/09/2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-ds-cream text-ds-ink">
      <header className="border-b border-ds-border bg-ds-cream/70 supports-[backdrop-filter]:backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold text-ds-ink hover:opacity-80">
            Dony.app
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
        <p className="mt-3 text-sm text-ds-muted-2">Atualizado em {UPDATED_AT}.</p>

        <div className="mt-10 space-y-10">
          <section className="space-y-3">
            <h2 className="text-xl font-bold">1. Sobre esta Política</h2>
            <p className="text-sm leading-relaxed text-ds-muted">
              Esta Política descreve como o Dony.app (“nós”) coleta, usa, armazena e compartilha dados
              pessoais quando você acessa o site, cria conta e usa o produto de gestão de pós-produção
              (o “Serviço”). Ela foi preparada em linguagem direta, mas não substitui aconselhamento
              jurídico.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">2. Quais dados coletamos</h2>
            <div className="space-y-3 text-sm leading-relaxed text-ds-muted">
              <p>
                O Dony.app pode tratar as seguintes categorias de dados, conforme o uso do Serviço:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <span className="font-semibold text-ds-ink">Dados de conta</span>: nome, e-mail,
                  foto de perfil e identificadores vinculados ao login (Google e/ou e-mail e senha).
                </li>
                <li>
                  <span className="font-semibold text-ds-ink">Dados do seu workspace</span>: nomes
                  de equipe/estúdio, membros, permissões, configurações e preferências.
                </li>
                <li>
                  <span className="font-semibold text-ds-ink">Conteúdo do usuário</span>: informações
                  que você cadastra (contatos, jobs, prazos, descrições, notas, tarefas, tickets de
                  suporte, links de entrega). Também respostas enviadas pelos seus clientes em
                  formulários públicos; o conteúdo depende do que você pedir no modelo (pode incluir
                  telefone, endereço ou CPF).
                </li>
                <li>
                  <span className="font-semibold text-ds-ink">Comunicação</span>: e-mails transacionais
                  que o app dispara (convite de equipe, entrega ao cliente, atribuição de tarefa,
                  tickets de suporte e aviso de formulário recebido). Na entrega, o app pode abrir o
                  WhatsApp Web no seu navegador com o telefone e a mensagem; a mensagem sai da sua
                  conta do WhatsApp, não de um servidor nosso.
                </li>
                <li>
                  <span className="font-semibold text-ds-ink">Dados de uso e diagnóstico</span>:
                  eventos técnicos para operar e proteger o Serviço (ex.: logs de acesso, IP, tipo de
                  navegador, datas/horários, páginas e ações) e medição de audiência no site (Vercel
                  Analytics).
                </li>
                <li>
                  <span className="font-semibold text-ds-ink">Cobrança e plano</span>: status do plano,
                  período e identificador da assinatura no processador de pagamento (hoje, Asaas).
                  Dados do cartão ficam com o Asaas; nós não guardamos o número completo.
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
                <li>Permitir colaboração (times, convites, permissões e perfil visível à equipe).</li>
                <li>Enviar os e-mails que você dispara no fluxo do produto e abrir o WhatsApp Web na entrega.</li>
                <li>Cobrar o plano Pro e manter o status da assinatura.</li>
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
            <h2 className="text-xl font-bold">5. Dados da Conta Google e Google Calendar</h2>
            <div className="space-y-3 text-sm leading-relaxed text-ds-muted">
              <p>O Dony.app usa a Conta Google de duas formas. As duas são separadas.</p>
              <p>
                <span className="font-semibold text-ds-ink">Login com Google.</span> O acesso ao
                produto pede e-mail, nome e foto de perfil para criar a conta, manter a sessão e
                mostrar seu perfil à equipe (board, tarefas, relatórios).
              </p>
              <p>
                <span className="font-semibold text-ds-ink">Google Calendar, opcional.</span> Um
                administrador do estúdio pode conectar o calendário principal (
                <span className="font-semibold text-ds-ink">primary</span>) da Conta Google. O app
                pede só isto:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>o e-mail da conta conectada, para mostrar qual Conta Google está ligada;</li>
                <li>
                  leitura dos eventos que essa conta criou nesse calendário. De cada evento usamos
                  identificador, título, início, fim, dia inteiro, descrição, local, link do evento
                  no Google Calendar e cor.
                </li>
              </ul>
              <p>
                Não criamos, alteramos nem apagamos eventos. Não pedimos a lista de outros
                calendários, Gmail, Drive nem Contatos.
              </p>
              <p>
                <span className="font-semibold text-ds-ink">Para que serve.</span> Mostrar esses
                compromissos na página Agenda, junto dos jobs, para as pessoas da mesma conta do
                estúdio. Sem a conexão, o restante do produto segue funcionando.
              </p>
              <p>
                <span className="font-semibold text-ds-ink">Com quem esses dados ficam.</span> O
                texto dos eventos não entra no nosso banco: a Agenda busca na hora em que alguém da
                equipe abre a página. Quem vê os compromissos na tela são os usuários dessa conta.
                Os tokens OAuth (acesso e atualização) e o e-mail da conta conectada ficam só no
                servidor, no banco (Supabase), ligados ao estúdio. A equipe não recebe esses tokens.
                Não mandamos dados do Google Calendar para pagamento (Asaas), e-mail transacional
                (Resend) nem medição de audiência.
              </p>
              <p>
                Não vendemos dados obtidos do Google. Não os passamos a corretores de dados,
                anunciantes ou revendedores de informação. Não os usamos para publicidade, análise de
                crédito ou empréstimo.
              </p>
              <p>
                <span className="font-semibold text-ds-ink">Proteção.</span> O tráfego vai por HTTPS.
                Os tokens só são lidos no servidor, com chave que não vai para o navegador. Só um
                administrador conecta ou desconecta a agenda.
              </p>
              <p>
                <span className="font-semibold text-ds-ink">Quanto tempo guardamos.</span> Enquanto a
                agenda estiver conectada, guardamos os tokens e o e-mail da conta Google. Ao
                desconectar em Configurações → Agenda, apagamos esses registros. A pessoa também
                pode tirar o acesso em{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  className="font-semibold text-ds-ink hover:underline"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  myaccount.google.com/permissions
                </a>
                . O conteúdo dos eventos não fica armazenado por nós. Para apagar a conta do
                Dony.app, escreva para{" "}
                <span className="font-semibold text-ds-ink">suporte@donyapp.com</span>.
              </p>
              <p>
                <span className="font-semibold text-ds-ink">Uso limitado.</span> O uso de dados brutos
                ou derivados recebidos das APIs do Google Workspace segue a Política de Dados do
                Usuário do Google, inclusive o Limited Use. Não usamos esses dados para desenvolver,
                melhorar ou treinar modelos de inteligência artificial ou de aprendizado de máquina
                generalizados.
              </p>
              <p className="text-ds-ink">
                The use of raw or derived user data received from Workspace APIs will adhere to the
                Google User Data Policy, including the Limited Use requirements.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">6. Compartilhamento de dados</h2>
            <div className="space-y-3 text-sm leading-relaxed text-ds-muted">
              <p>
                Podemos compartilhar dados com provedores que operam partes do Serviço, na medida
                necessária para prestá-lo. Hoje isso inclui hospedagem (Vercel), autenticação e banco
                (Supabase), e-mail transacional (Resend) e pagamentos (Asaas). Também usamos Vercel
                Analytics no site. Título, horário e o restante do evento do Google Calendar não vão
                para Asaas, Resend nem Analytics. No Supabase ficam só os tokens e o e-mail da conta
                conectada, como na seção 5.
              </p>
              <p>
                Existe uma API pública e um fluxo OAuth para aplicativos ou agentes que você autorizar.
                Esse acesso lê resumo de perfil e plano da conta, sem jobs nem dados de clientes do
                estúdio.
              </p>
              <p>
                Também podemos compartilhar informações quando exigido por lei, ordem judicial ou
                para proteger direitos e segurança do Serviço e de terceiros.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">7. Cookies e tecnologias similares</h2>
            <p className="text-sm leading-relaxed text-ds-muted">
              Usamos cookies e armazenamento local para manter sua sessão, lembrar preferências da
              interface e medir visitas no site (Vercel Analytics). Você pode gerenciar cookies no
              navegador; login e algumas funções param de funcionar se a sessão for bloqueada.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">8. Retenção e exclusão</h2>
            <p className="text-sm leading-relaxed text-ds-muted">
              Mantemos dados pelo tempo em que a conta existir e pelo prazo necessário para obrigações
              legais. Tokens da agenda Google são apagados quando um administrador desconecta a
              integração. O conteúdo dos eventos do Calendar não fica no nosso banco. Não há botão de
              autoexclusão no app: para apagar conta ou dados, escreva para{" "}
              <span className="font-semibold text-ds-ink">suporte@donyapp.com</span>. Em alguns casos
              pode haver retenção mínima por lei, prevenção de fraude ou auditoria.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">9. Segurança</h2>
            <p className="text-sm leading-relaxed text-ds-muted">
              Adotamos medidas técnicas e organizacionais para proteger os dados (ex.: controle de
              acesso, criptografia em trânsito, segregação de ambientes). Mesmo assim, nenhum sistema
              é 100% infalível; por isso, recomendamos proteger suas credenciais e dispositivo.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">10. Direitos do titular</h2>
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
            <h2 className="text-xl font-bold">11. Crianças e adolescentes</h2>
            <p className="text-sm leading-relaxed text-ds-muted">
              O Serviço não é direcionado a menores de 18 anos. Se você acredita que dados de menores
              foram tratados indevidamente, contate o suporte.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">12. Alterações desta Política</h2>
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

