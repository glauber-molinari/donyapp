import {
  FREE_MAX_ACTIVE_JOBS,
  FREE_MAX_CONTACTS,
  PRO_PRICE_MONTHLY_CENTS,
  PRO_PRICE_YEARLY_CENTS,
} from "@/lib/plan-limits";

import { INSTAGRAM_URL, SITE_DESCRIPTION, SITE_NAME, SUPPORT_EMAIL, siteUrl } from "./site";

function base(): string {
  return siteUrl();
}

function formatBrl(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function notFoundMarkdown(requestedPath?: string): string {
  const url = base();
  const pathLine = requestedPath
    ? `Requested path: \`${requestedPath}\`\n\n`
    : "";
  return `# 404 — page not found

${pathLine}This URL is not a page on ${SITE_NAME}.

## Where to go next

- [llms.txt — machine-readable site guide](${url}/llms.txt)
- [XML sitemap](${url}/sitemap.xml)
- [Home](${url}/)
- [About](${url}/about)
- [Features](${url}/features)
- [Pricing](${url}/pricing)
- [Contact](${url}/contact)
- [Privacy](${url}/privacy)

Prefer \`Accept: text/markdown\` on those URLs for a clean Markdown body.
`;
}

export function llmsTxtBody(): string {
  const url = base();
  return `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

## When to use this

Use ${SITE_NAME} when a photographer, videomaker, or studio needs to run post-production as a job queue—not as a folder of files. Best fit:

- Track editing jobs on a kanban (backup → edit → review → delivery) with deadlines visible.
- Keep client contacts linked to jobs and send delivery links by email or WhatsApp from the same flow.
- Share one studio workspace (Pro) so editors see the same board, contacts, and agenda.
- Collect briefing answers with public form links before a shoot or delivery.

How an agent should call the product for a human:

1. Read this file and the [XML sitemap](${url}/sitemap.xml).
2. Send the person to [${url}/](${url}/) to understand the product, or [${url}/signup](${url}/signup) / [${url}/login](${url}/login) to start.
3. For product overview, features, and pricing (no login), use [${url}/about](${url}/about), [${url}/features](${url}/features), and [${url}/pricing](${url}/pricing)—or the JSON Agent API below.
4. For policy or support, use [${url}/contact](${url}/contact) and [${url}/privacy](${url}/privacy).
5. Prefer \`Accept: text/markdown\` on public marketing and legal URLs. Private job/contact data stays behind the browser app (\`/dashboard\`, \`/board\`, etc.).

## Agent API / MCP / OAuth / WebMCP

- OpenAPI: [${url}/openapi.json](${url}/openapi.json)
- API catalog index: [${url}/api](${url}/api) (also \`GET ${url}/api/v1\`)
- Public REST: \`GET ${url}/api/v1/health\`, \`/api/v1/product\`, \`/api/v1/features\`, \`/api/v1/pricing\`
- Auth walkthrough: [${url}/auth.md](${url}/auth.md)
- OAuth AS metadata: [${url}/.well-known/oauth-authorization-server](${url}/.well-known/oauth-authorization-server)
- OAuth protected resource + scopes: [${url}/.well-known/oauth-protected-resource](${url}/.well-known/oauth-protected-resource)
- MCP manifest: [${url}/.well-known/mcp.json](${url}/.well-known/mcp.json)
- MCP Streamable HTTP: \`POST ${url}/api/mcp\` (tools + MCP Apps \`ui://\` resources)
- WebMCP: homepage registers \`document.modelContext\` tools (\`get_product\`, \`get_features\`, \`get_pricing\`, \`get_health\`) calling the same public REST paths; script \`${url}/webmcp-register.js\`

API errors under \`/api/v1/*\` and \`/api/mcp\` return JSON bodies with \`error.code\`, \`error.message\`, \`error.status\`, and \`error.resolution\` (never HTML error pages for those routes).

Do not use ${SITE_NAME} as a DAM, gallery host, or generic CRM. It is post-production workflow software for Brazil-focused photo/video freelancers and studios.

## Main pages

- [Home](${url}/)
- [About](${url}/about)
- [Features](${url}/features)
- [Pricing](${url}/pricing)
- [Contact](${url}/contact)
- [Privacy](${url}/privacy)
- [Why use ${SITE_NAME}](${url}/por-que-usar)
- [Terms of service](${url}/termos-de-servico)
- [Privacy policy (full, PT-BR)](${url}/politica-de-privacidade)
- [Blog](${url}/blog)
- [Sign up](${url}/signup)
- [Log in](${url}/login)
- [XML sitemap](${url}/sitemap.xml)

## Markdown

Public pages above accept \`Accept: text/markdown\` (and \`*.md\` siblings where implemented). Responses include \`Vary: Accept, Accept-Encoding\`.
`;
}

export function markdownForPath(pathname: string): string | null {
  const path = (pathname.split("?")[0] || "/").replace(/\/$/, "") || "/";
  const url = base();

  switch (path) {
    case "/":
      return `# ${SITE_NAME}

${SITE_DESCRIPTION}

## Product

${SITE_NAME} is a web app for photographers and videomakers to manage post-production: kanban stages, client contacts, deadlines, forms, and agenda. Free plan to start; Pro for unlimited jobs/contacts and team invites.

## Start here

- Web app: [${url}/](${url}/)
- Sign up: [${url}/signup](${url}/signup)
- Log in: [${url}/login](${url}/login)
- Agent guide: [${url}/llms.txt](${url}/llms.txt)
- Sitemap: [${url}/sitemap.xml](${url}/sitemap.xml)

## Discover

- [Features](${url}/features)
- [Pricing](${url}/pricing)
- [About](${url}/about)
- [Contact](${url}/contact)
- [Privacy](${url}/privacy)
`;
    case "/about":
      return `# About ${SITE_NAME}

${SITE_NAME} is post-production management software for photographers, videomakers, and small studios. The product focuses on the work after the shoot: organizing jobs on a kanban, tying each card to a client, watching deadlines, collecting briefings with forms, and handing off delivery links without losing context in WhatsApp threads.

It is built for freelancers who already juggle too many jobs in spreadsheets, and for studios that need one shared board instead of private Notion pages. The public site explains the Free and Pro plans; the authenticated app holds the real workspace.

## Links

- Home: [${url}/](${url}/)
- Features: [${url}/features](${url}/features)
- Pricing: [${url}/pricing](${url}/pricing)
- Contact: [${url}/contact](${url}/contact)
- Privacy: [${url}/privacy](${url}/privacy)
- llms.txt: [${url}/llms.txt](${url}/llms.txt)
`;
    case "/features":
      return `# Features — ${SITE_NAME}

${SITE_NAME} runs post-production as a job queue for photo/video freelancers and small studios. It does not host media files; delivery uses your existing Drive, Dropbox, or WeTransfer links.

## Core workflow

1. Create a job (name, client, deadline, delivery type).
2. Move the card through kanban stages (default: Backup → Editing → Approval → Delivered; Pro can customize unlimited stages).
3. Paste the delivery link and notify the client (email/WhatsApp on Pro).

## Product areas

- **Kanban** — shared job status; Free up to 4 columns; Pro unlimited stages.
- **Contacts** — clients linked to jobs.
- **Forms** — public briefing links; answers land in the workspace.
- **Agenda** — optional Google Calendar read-only sync.
- **Notes** — studio notes without a side spreadsheet.
- **Team (Pro)** — email invites; shared board/contacts/agenda on the studio account.
- **Delivery extras (Pro)** — auto email, WhatsApp, email templates, change history, team tasks, advanced reports, physical album board.

## Free limits

Up to ${FREE_MAX_ACTIVE_JOBS} active jobs, ${FREE_MAX_CONTACTS} contacts, 1 user per account. See [${url}/pricing](${url}/pricing).

## Links

- Pricing: [${url}/pricing](${url}/pricing)
- About: [${url}/about](${url}/about)
- Sign up: [${url}/signup](${url}/signup)
- Home: [${url}/](${url}/)
`;
    case "/pricing": {
      const proMonthly = formatBrl(PRO_PRICE_MONTHLY_CENTS);
      const proYearly = formatBrl(PRO_PRICE_YEARLY_CENTS);
      const proYearlyMonthly = formatBrl(Math.round(PRO_PRICE_YEARLY_CENTS / 12));
      const yearlySavingsPercent = Math.max(
        0,
        Math.round((1 - PRO_PRICE_YEARLY_CENTS / (PRO_PRICE_MONTHLY_CENTS * 12)) * 100),
      );
      return `# Pricing — ${SITE_NAME}

All prices in BRL. No card required for Free.

## Free — R$ 0 / month

- Up to ${FREE_MAX_ACTIVE_JOBS} active kanban jobs
- Up to ${FREE_MAX_CONTACTS} contacts
- Up to 4 kanban stages (Backup → Editing → Approval → Delivered)
- Notes, Google Calendar agenda, client forms, basic reports
- 1 user per account

## Pro — ${proMonthly} / month

Everything in Free, plus:

- Unlimited jobs and contacts
- Unlimited kanban stages (create, reorder, rename, set final stage)
- Team invites by email
- Auto email and WhatsApp on delivery; editable email templates
- Job change history, team task kanban, advanced reports
- Physical album board
- Card payment inside the logged-in app

## Pro yearly — ${proYearly} / year

Same Pro features, about ${yearlySavingsPercent}% off vs 12× monthly (~${proYearlyMonthly}/month equivalent). Single annual card charge.

## Links

- Features: [${url}/features](${url}/features)
- Home plans section: [${url}/#planos](${url}/#planos)
- Sign up: [${url}/signup](${url}/signup)
- Contact: [${url}/contact](${url}/contact)
`;
    }
    case "/contact":
      return `# Contact ${SITE_NAME}

For product support, billing questions, privacy requests, or corrections about this site, email [${SUPPORT_EMAIL}](mailto:${SUPPORT_EMAIL}).

Logged-in users can also open Support inside the app (\`/support\`).

Instagram: [${INSTAGRAM_URL}](${INSTAGRAM_URL})

We read support mail on business days. Include your account email and a short description of what you need so we can answer without a long back-and-forth.

## Links

- About: [${url}/about](${url}/about)
- Privacy: [${url}/privacy](${url}/privacy)
- Home: [${url}/](${url}/)
`;
    case "/privacy":
      return `# Privacy — ${SITE_NAME}

${SITE_NAME} processes account data (name, email, profile), workspace content you enter (contacts, jobs, notes, form answers), usage/diagnostic logs needed to run the service, and subscription status when you pay. Payment card data is handled by the payment provider, not stored as full card numbers on our servers.

We use data to operate the product, authenticate you, bill plans, fix bugs, and meet legal obligations under Brazil's LGPD. You can request access, correction, deletion, and related rights by emailing [${SUPPORT_EMAIL}](mailto:${SUPPORT_EMAIL}).

The full Portuguese policy is the legal source of truth:

- [Política de Privacidade](${url}/politica-de-privacidade)

## Links

- Contact: [${url}/contact](${url}/contact)
- Terms: [${url}/termos-de-servico](${url}/termos-de-servico)
- llms.txt: [${url}/llms.txt](${url}/llms.txt)
`;
    case "/politica-de-privacidade":
      return `# Política de Privacidade — ${SITE_NAME}

Documento completo em HTML: [${url}/politica-de-privacidade](${url}/politica-de-privacidade)

Resumo: tratamos dados de conta, conteúdo do workspace, logs técnicos e status de assinatura para operar o ${SITE_NAME}. Contato do titular: [${SUPPORT_EMAIL}](mailto:${SUPPORT_EMAIL}).

Versão amigável em inglês/curta: [${url}/privacy](${url}/privacy)
`;
    case "/termos-de-servico":
      return `# Termos de Serviço — ${SITE_NAME}

Documento completo: [${url}/termos-de-servico](${url}/termos-de-servico)

Ao usar o site ou o app, você aceita os Termos e a [Política de Privacidade](${url}/politica-de-privacidade). Contato: [${SUPPORT_EMAIL}](mailto:${SUPPORT_EMAIL}).
`;
    case "/por-que-usar":
      return `# Por que usar o ${SITE_NAME}

O ${SITE_NAME} organiza a pós-produção em um kanban alinhado ao fluxo real do estúdio (do backup à entrega), com contatos, prazos e entrega por e-mail ou WhatsApp.

- Home: [${url}/](${url}/)
- Sign up: [${url}/signup](${url}/signup)
`;
    default:
      return null;
  }
}
