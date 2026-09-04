import {
  FREE_MAX_ACTIVE_JOBS,
  FREE_MAX_CONTACTS,
  PRO_PRICE_MONTHLY_CENTS,
  PRO_PRICE_YEARLY_CENTS,
} from "@/lib/plan-limits";

import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SUPPORT_EMAIL,
  siteUrl,
} from "../site";

export function publicProduct() {
  const base = siteUrl();
  return {
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: base,
    locale: "pt-BR",
    category: "post_production_workflow",
    audience: ["photographers", "videomakers", "small_studios"],
    supportEmail: SUPPORT_EMAIL,
    links: {
      home: `${base}/`,
      features: `${base}/features`,
      pricing: `${base}/pricing`,
      signup: `${base}/signup`,
      login: `${base}/login`,
      contact: `${base}/contact`,
      llmsTxt: `${base}/llms.txt`,
      openapi: `${base}/openapi.json`,
      mcp: `${base}/api/mcp`,
      mcpManifest: `${base}/.well-known/mcp.json`,
      authDocs: `${base}/auth.md`,
      oauthAuthorizationServer: `${base}/.well-known/oauth-authorization-server`,
      oauthProtectedResource: `${base}/.well-known/oauth-protected-resource`,
    },
  };
}

export function publicFeatures() {
  return {
    product: SITE_NAME,
    areas: [
      {
        id: "kanban",
        name: "Kanban de edição",
        description:
          "Jobs de pós-produção em colunas (backup → edição → aprovação → entrega). Free até 4 estágios; Pro com estágios ilimitados.",
      },
      {
        id: "contacts",
        name: "Contatos",
        description: "Clientes ligados aos jobs do estúdio.",
      },
      {
        id: "forms",
        name: "Formulários",
        description: "Links públicos de briefing; respostas caem no workspace.",
      },
      {
        id: "agenda",
        name: "Agenda",
        description: "Sincronização opcional read-only com Google Calendar.",
      },
      {
        id: "team",
        name: "Equipe (Pro)",
        description: "Convites por e-mail e board compartilhado no estúdio.",
      },
      {
        id: "delivery",
        name: "Entrega (Pro)",
        description:
          "E-mail/WhatsApp na entrega, templates, histórico e board de álbum físico.",
      },
    ],
    freeLimits: {
      activeJobs: FREE_MAX_ACTIVE_JOBS,
      contacts: FREE_MAX_CONTACTS,
      usersPerAccount: 1,
      kanbanStages: 4,
    },
  };
}

export function publicPricing() {
  return {
    currency: "BRL",
    plans: [
      {
        id: "free",
        name: "Free",
        priceMonthlyCents: 0,
        priceYearlyCents: 0,
        limits: {
          activeJobs: FREE_MAX_ACTIVE_JOBS,
          contacts: FREE_MAX_CONTACTS,
          users: 1,
          kanbanStages: 4,
        },
        highlights: [
          "Kanban com até 4 estágios",
          "Notas, agenda e formulários",
          "1 usuário por conta",
        ],
      },
      {
        id: "pro",
        name: "Pro",
        priceMonthlyCents: PRO_PRICE_MONTHLY_CENTS,
        priceYearlyCents: PRO_PRICE_YEARLY_CENTS,
        limits: {
          activeJobs: null,
          contacts: null,
          users: null,
          kanbanStages: null,
        },
        highlights: [
          "Jobs e contatos ilimitados",
          "Estágios ilimitados e convites de equipe",
          "Entrega por e-mail/WhatsApp e board de álbum",
        ],
      },
    ],
  };
}

export function publicHealth() {
  return {
    status: "ok" as const,
    service: SITE_NAME,
    time: new Date().toISOString(),
  };
}
