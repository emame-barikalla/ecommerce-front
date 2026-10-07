export function cleanPhoneNumber(number: string): string {
  return number.replace(/[^0-9]/g, '');
}

/**
 * Callers must check that a number is configured first (`settings.whatsappNumber`
 * is `null` otherwise) — a `wa.me` link without one silently goes nowhere.
 */
export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  return `https://wa.me/${cleanPhoneNumber(phoneNumber)}?text=${encodeURIComponent(message)}`;
}

export function generateOrderId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
}

export function openWhatsApp(phoneNumber: string, message: string): void {
  window.open(buildWhatsAppUrl(phoneNumber, message), '_blank', 'noopener,noreferrer');
}
