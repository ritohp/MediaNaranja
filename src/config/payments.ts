/**
 * Configuración centralizada de enlaces de pago de Stripe para Media Naranja.
 */

export const STRIPE_PAYMENT_LINKS = {
  // Solo Canción MP3 ($249 MXN)
  SOLO_CANCION_249: 'https://buy.stripe.com/dRmdR23mZ07ZdIEfQf2Ry01',

  // Experiencia Loveflix Digital completa ($399 MXN)
  // Canción completa MP3 + Mini web interactiva + Fotos + Voz + Lámina PDF con QR
  LOVEFLIX_FULL_399: 'https://buy.stripe.com/28EaEQaPr1c30VS7jJ2Ry02',

  // Upgrade Serie Loveflix Digital ($199 MXN)
  // Para usuarios que ya habían comprado previamente su canción
  LOVEFLIX_UPGRADE_199: 'https://buy.stripe.com/7sYeV68HjcUL5c833t2Ry03',
} as const;

export type StripeProductType = 'solo_cancion' | 'loveflix_full' | 'loveflix_upgrade';

/**
 * Construye la URL de pago de Stripe adjuntando client_reference_id
 * para que el webhook de Supabase desbloquee la canción o el recuerdo automáticamente.
 */
export const getStripeCheckoutUrl = (
  productType: StripeProductType,
  referenceId: string
): string => {
  let baseUrl: string;
  switch (productType) {
    case 'loveflix_full':
      baseUrl = STRIPE_PAYMENT_LINKS.LOVEFLIX_FULL_399;
      break;
    case 'loveflix_upgrade':
      baseUrl = STRIPE_PAYMENT_LINKS.LOVEFLIX_UPGRADE_199;
      break;
    case 'solo_cancion':
    default:
      baseUrl = STRIPE_PAYMENT_LINKS.SOLO_CANCION_249;
      break;
  }
  return `${baseUrl}?client_reference_id=${encodeURIComponent(referenceId)}`;
};
