/**
 * Normalises an Uzbek mobile number to +998XXXXXXXXX. Accepts spaces, dashes, brackets and the
 * local forms "90 123 45 67" / "998901234567". Returns null for anything else.
 */
export function normaliseUzPhone(input: string): string | null {
  const digits = input.replace(/[\s()-]/g, '').replace(/^\+/, '');
  if (!/^\d+$/.test(digits)) return null;
  const national = digits.length === 12 && digits.startsWith('998') ? digits.slice(3) : digits;
  // Operator code (2 digits) + 7-digit subscriber number
  return /^\d{9}$/.test(national) ? `+998${national}` : null;
}

/** "+998 90 *** ** 67": enough to recognise, not enough to collect numbers from the admin UI. */
export function maskPhone(phone: string): string {
  return phone.length === 13 ? `${phone.slice(0, 4)} ${phone.slice(4, 6)} *** ** ${phone.slice(11)}` : phone;
}
