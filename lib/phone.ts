/**
 * Mobile money phone numbers.
 *
 * A waiter typing a number that is one digit out sends the payment prompt to
 * the wrong person, so numbers are normalised to the form PesaPal expects and
 * validated before any money moves.
 */

/**
 * Normalise a Kenyan mobile number to the international form PesaPal expects:
 * 2547XXXXXXXX or 2541XXXXXXXX.
 *
 * Accepts the shapes a waiter actually types:
 *   0712345678  712345678  +254712345678  254712345678  0712 345 678
 *
 * Returns null when the result is not a plausible Kenyan mobile number, so a
 * typo is caught before a payment request is created rather than after the
 * prompt has vanished into someone else's phone.
 */
export function normaliseKenyanPhone(input: string): string | null {
  if (!input) return null

  // strip spaces, dashes, brackets and any stray formatting
  let digits = input.replace(/[\s\-().]/g, '')

  // drop a leading 00 international prefix
  if (digits.startsWith('00')) digits = `+${digits.slice(2)}`
  if (digits.startsWith('+')) digits = digits.slice(1)

  // 2547... / 2541... are already international
  if (digits.startsWith('254')) {
    digits = digits.slice(3)
  } else if (digits.startsWith('0')) {
    // 07... / 01... local format
    digits = digits.slice(1)
  }

  // Kenyan mobile numbers are 9 digits starting 7 or 1
  if (!/^[17]\d{8}$/.test(digits)) return null

  return `254${digits}`
}

/** Human-readable form for display: 0712 345 678. */
export function formatKenyanPhone(normalised: string): string {
  if (!normalised.startsWith('254') || normalised.length !== 12) return normalised
  const local = normalised.slice(3)
  return `0${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
}

/** Whether the number is plausibly a Kenyan mobile-money number. */
export function isKenyanMobile(input: string): boolean {
  return normaliseKenyanPhone(input) !== null
}
