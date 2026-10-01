'use client'

import { staffErrorText, type StaffFacingCode } from '@/lib/errors'

/**
 * Turns a failed API call into one sentence a member of staff can act on.
 *
 * The API sends a code, a plain-English message, and the technical detail
 * separately. Only the message is ever shown: the detail goes to the console
 * so it is available in a bug report without ever appearing on screen.
 */
export function describeApiError(error: unknown, fallback: StaffFacingCode = 'UNKNOWN'): string {
  // A real Error thrown by our own code is already safe to show.
  if (error instanceof Error && !error.message.includes('fetch failed')) {
    return error.message
  }

  return staffErrorText(fallback)
}

/**
 * Read the code from an API error response and return the staff-facing text.
 */
export async function errorFromResponse(
  response: Response,
  fallback: StaffFacingCode = 'UNKNOWN',
): Promise<string> {
  try {
    const body = await response.json()
    if (body?.code && body?.message) {
      // The technical detail is useful in the terminal, never on screen.
      if (body.detail) {
        console.error('[api error]', body.code, body.detail)
      }
      return body.hint ? `${body.message} ${body.hint}` : body.message
    }
  } catch {
    // fall through to the generic message
  }
  return staffErrorText(fallback)
}
