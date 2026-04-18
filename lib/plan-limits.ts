/** Limites do plano Free (PRODUCT.md PASSO 13). */
export const FREE_MAX_ACTIVE_JOBS = 5;
export const FREE_MAX_CONTACTS = 20;

/** Preço Pro mensal em centavos (R$ 37,90). */
export const PRO_PRICE_MONTHLY_CENTS = 3790;

/** Preço Pro anual: soma de 12 meses ao preço mensal com 17% de desconto (centavos, arredondado). */
export const PRO_PRICE_YEARLY_CENTS = Math.round(PRO_PRICE_MONTHLY_CENTS * 12 * 0.83);
