/**
 * Utility for robust WhatsApp deep link generation & phone number normalization.
 */

/**
 * Clean a raw phone number to full international digit string without leading + or 0.
 * Examples:
 *   "+91 98400 11223" -> "919840011223"
 *   "9840011223"      -> "919840011223" (defaults to India country code 91 if 10 digits)
 *   "09840011223"     -> "919840011223" (replaces leading 0 with 91)
 *   "919840011223"    -> "919840011223"
 */
export function cleanWhatsAppNumber(phone?: string | null): string {
  if (!phone) return '919840011223';
  let digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return '919840011223';

  if (digits.length === 10) {
    digits = '91' + digits;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = '91' + digits.substring(1);
  }

  return digits;
}

/**
 * Generate a valid, properly encoded WhatsApp universal link (wa.me)
 */
export function getWhatsAppUrl(phone?: string | null, message?: string): string {
  const cleaned = cleanWhatsAppNumber(phone);
  const textQuery = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${cleaned}${textQuery}`;
}

/**
 * Safely open a WhatsApp link in a new tab / native app across Desktop and Mobile
 */
export function openWhatsApp(phone?: string | null, message?: string): void {
  const url = getWhatsAppUrl(phone, message);
  window.open(url, '_blank', 'noopener,noreferrer');
}
