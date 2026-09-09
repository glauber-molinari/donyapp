/** Limites do plano Free (PRODUCT.md PASSO 13). */
export const FREE_MAX_ACTIVE_JOBS = 5;
export const FREE_MAX_CONTACTS = 20;

/** Preço Pro mensal em centavos (R$ 47,90). */
export const PRO_PRICE_MONTHLY_CENTS = 4790;

/**
 * Preço Pro anual em centavos (R$ 477,00).
 * 12 × R$ 47,90 com ~17% de desconto. O valor foi arredondado para reais cheios
 * (a conta exata daria R$ 477,08).
 */
export const PRO_PRICE_YEARLY_CENTS = 47700;

/** Preço original ("de") antes do desconto — usado na landing page para mostrar o risco. */
export const PRO_PRICE_ORIGINAL_MONTHLY_CENTS = 5790;
export const PRO_PRICE_ORIGINAL_YEARLY_CENTS = PRO_PRICE_ORIGINAL_MONTHLY_CENTS * 12;

/** Álbum (board físico) é feature Pro: Free pode visualizar mas não criar. */
export function canCreateAlbum(plan: string | null | undefined): boolean {
  return plan === "pro";
}
