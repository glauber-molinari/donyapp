import type { Metadata } from "next";

import s from "./styles.module.css";

export const metadata: Metadata = {
  title: "Changelog · Dony DS",
};

type NavItem = { href: string; label: string; active?: boolean };
type NavGroup = { title?: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    items: [
      { href: "/design-system", label: "Visão geral" },
      { href: "/design-system/changelog", label: "Changelog", active: true },
    ],
  },
  {
    title: "Fundamentos",
    items: [{ href: "/design-system/fundamentos", label: "Cores, tipografia, espaço" }],
  },
  {
    title: "Componentes",
    items: [
      { href: "/design-system/formularios", label: "Formulários" },
      { href: "/design-system/dados", label: "Exibição de dados" },
      { href: "/design-system/navegacao", label: "Navegação" },
      { href: "/design-system/feedback", label: "Feedback" },
    ],
  },
  {
    title: "Produto",
    items: [
      { href: "/design-system/kanban", label: "Kanban" },
      { href: "/design-system/padroes", label: "Padrões" },
    ],
  },
  {
    title: "Escrita",
    items: [{ href: "/design-system/voz", label: "Voz e tom" }],
  },
];

export default function ChangelogPage() {
  return (
    <div className={s.root}>
      <div className={s.layout}>
        {/* ── Sidebar ── */}
        <aside className={s.sidebar}>
          <a href="/design-system" className={s.brand}>
            <span className={s.brandMark}>D</span>
            <span className={s.brandName}>Dony</span>
            <span className={s.brandTag}>DS</span>
          </a>

          {NAV.map((group, i) => (
            <nav key={i} className={s.navGroup}>
              {group.title && <div className={s.navGroupTitle}>{group.title}</div>}
              {group.items.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={item.active ? `${s.navItem} ${s.active}` : s.navItem}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          ))}

          <div className={s.sidebarFoot}>
            <div>v0.1 · 2026</div>
            <div>Para Dony.app · pt-BR</div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className={s.main}>
          <div className={s.pageHead}>
            <div className={s.eyebrow}>Histórico</div>
            <h1 className={s.h1}>
              Changelog.
              <small>
                O que mudou em cada versão deste design system. Mudanças quebradoras (renomear
                token, remover variante) ficam em <em>negrito</em> — adote com cuidado em código.
              </small>
            </h1>
          </div>

          <div className={s.log}>
            {/* v0.2 — planejado */}
            <div className={s.logEntry}>
              <div className={s.logMeta}>
                <span className={`${s.ver} ${s.unreleased}`}>v0.2 · planejado</span>
                <br />
                em discussão
                <br />
                —
              </div>
              <div className={s.logBody}>
                <h3>Em estudo para a próxima</h3>

                <div className={`${s.logSection} ${s.planned}`}>
                  <div className={s.sectionLabel}>Planejado</div>
                  <ul>
                    <li>
                      Página de <strong>Marca</strong> — logo, espaço de respiro, do/don&apos;t,
                      uso sobre fotos.
                    </li>
                    <li>
                      Exportar tokens para um pacote <code>@dony/tokens</code> compartilhado entre
                      app e site.
                    </li>
                    <li>
                      Componentes <strong>mobile-specific</strong> do Kanban (já existe hotfix em
                      produção).
                    </li>
                    <li>
                      Padrão de <strong>filtros</strong> e{" "}
                      <strong>combobox com busca</strong> (listas &gt; 10).
                    </li>
                    <li>
                      Padrão de <strong>onboarding</strong> com driver.js — tour passos e copy.
                    </li>
                  </ul>
                </div>

                <div className={s.logSection}>
                  <div className={s.sectionLabel}>Não vai entrar</div>
                  <ul>
                    <li>
                      Modo escuro — usuário edita em monitor calibrado; creme não compete com a
                      imagem.
                    </li>
                    <li>
                      Ilustrações geradas — só entrarão como assets reais, com regra de uso.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* v0.1 */}
            <div className={s.logEntry}>
              <div className={s.logMeta}>
                <span className={s.ver}>v0.1</span>
                <br />
                25 / 05 / 2026
                <br />
                versão inicial
              </div>
              <div className={s.logBody}>
                <h3>Primeira versão escrita</h3>

                <div className={`${s.logSection} ${s.added}`}>
                  <div className={s.sectionLabel}>Adicionado</div>
                  <ul>
                    <li>
                      <strong>Fundamentos</strong> — paleta (creme, ink, accent, sinais), tipografia
                      Inter em 4 escalas, espaçamento em múltiplos de 4, 5 raios, 4 sombras, 2
                      durações de transição.
                    </li>
                    <li>
                      <strong>Formulários</strong> — Button (4 variantes × 3 tamanhos), Input,
                      Select, Textarea, Checkbox, Radio, Switch + regras de acessibilidade.
                    </li>
                    <li>
                      <strong>Exibição de dados</strong> — Card (padrão + variantes de stat), Table,
                      Badge (6 tons + Pro), Avatar (com cores determinísticas), Tag.
                    </li>
                    <li>
                      <strong>Navegação</strong> — app shell completo (sidebar 220px + topbar 56px),
                      3 estados de item de menu, Tabs, Breadcrumb, Page header.
                    </li>
                    <li>
                      <strong>Feedback</strong> — Toast, Alert, Modal, Empty state, Skeleton +
                      hierarquia de severidade (inline → toast → alert → modal).
                    </li>
                    <li>
                      <strong>Kanban</strong> — board completo, anatomia do job card, 4 estados de
                      prazo, comportamento de drag &amp; drop, regras mobile, personalização de
                      etapas.
                    </li>
                    <li>
                      <strong>Padrões</strong> — Pro badge nos 3 contextos (menu, inline, paywall),
                      formatação de deadline em pt-BR, fluxo do e-mail de entrega, regras de
                      comunicação de limites Free.
                    </li>
                    <li>
                      <strong>Voz e tom</strong> — 4 adjetivos da voz, tabela de tom por situação,
                      do/don&apos;t em copy real, glossário, regras de texto de botão.
                    </li>
                  </ul>
                </div>

                <div className={s.logSection}>
                  <div className={s.sectionLabel}>Decisões registradas</div>
                  <ul>
                    <li>
                      Canvas é <strong>creme</strong>, nunca branco puro — branco fica reservado a
                      superfícies elevadas (cards, modais).
                    </li>
                    <li>
                      Accent (<code>#ff5500</code>) aparece em{" "}
                      <strong>no máximo um lugar por tela</strong>.
                    </li>
                    <li>Toda copy em pt-BR direto no JSX — i18n não é prioridade.</li>
                    <li>
                      Tokens canônicos vivem em <code>tailwind.config.js</code> e{" "}
                      <code>app/globals.css</code>; este DS espelha esses nomes.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer nav */}
          <div className={s.foot}>
            <a href="/design-system">
              <span className={s.nextLabel}>Volte</span>
              <span>← Visão geral</span>
            </a>
            <a href="/design-system/fundamentos" className={s.footNext}>
              <span className={s.nextLabel}>Comece pelos</span>
              <span>Fundamentos →</span>
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}
