/**
 * Feature flags para "ship dark": features mergeadas na master mas escondidas
 * atrás de uma flag até estarem prontas para produção.
 *
 * Duas táticas combinadas (ver docs/fluxo-desenvolvimento.md):
 *  - ENV por ambiente (NEXT_PUBLIC_FF_*): rápida; escopada por ambiente na
 *    Vercel (ex.: ligada só em Preview). Mudar exige redeploy.
 *  - Banco (tabela feature_flags): liga em produção em runtime, sem redeploy.
 *
 * Este arquivo é seguro para o client (não importa nada de server). A leitura
 * com fallback no banco fica em `lib/feature-flags.server.ts`.
 */

/**
 * Registro de flags conhecidas. Adicione uma entrada por feature em
 * desenvolvimento; remova quando a feature vira padrão (GA).
 *
 * IMPORTANTE: o Next só "inlina" NEXT_PUBLIC_* no bundle do client quando o
 * acesso é ESTÁTICO (process.env.NEXT_PUBLIC_FOO literal). Por isso o default de
 * client mora em CLIENT_ENV_FLAGS abaixo, com acesso literal por flag.
 */
export const FEATURE_FLAGS = {
  demo: {
    description: "Flag de exemplo para validar o fluxo de feature flags.",
    /** Variável de ambiente que liga a flag (fallback quando não há linha no banco). */
    envVar: "NEXT_PUBLIC_FF_DEMO",
  },
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

function truthy(value: string | undefined): boolean {
  return value === "true" || value === "1";
}

/**
 * Default de client por flag, com acesso ESTÁTICO a process.env para o Next
 * inlinar no bundle. Mantenha uma linha por flag espelhando FEATURE_FLAGS.
 */
const CLIENT_ENV_FLAGS: Record<FeatureFlagKey, boolean> = {
  demo: truthy(process.env.NEXT_PUBLIC_FF_DEMO),
};

/**
 * Versão client-only: olha só a ENV NEXT_PUBLIC_* embutida no build.
 * Use em Client Components quando não precisa do override em runtime do banco.
 */
export function isFeatureEnabledFromEnv(key: FeatureFlagKey): boolean {
  return CLIENT_ENV_FLAGS[key] ?? false;
}
