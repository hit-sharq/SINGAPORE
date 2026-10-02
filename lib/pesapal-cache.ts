import { pesapalGetAuthToken, pesapalRegisterIpn, pesapalListIpn } from '@/lib/pesapal'

/**
 * Caches the PesaPal bearer token and the registered IPN id in memory.
 *
 * A token lasts about five minutes, so authenticating per request would triple
 * the number of calls for no benefit. The IPN id is stable for a given URL, so
 * it is registered once per process rather than on every payment.
 *
 * In-memory rather than persisted: a restart costs one extra authentication,
 * which is preferable to storing a short-lived credential at rest.
 */

let cachedToken: { value: string; expiresAt: number } | null = null
let cachedIpn: { notificationId: string; url: string } | null = null

/** Refresh a little early so a token does not expire mid-request. */
const TOKEN_MARGIN_MS = 60_000

export async function getPesapalToken(
  consumerKey: string,
  consumerSecret: string,
): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + TOKEN_MARGIN_MS) {
    return cachedToken.value
  }

  const auth = await pesapalGetAuthToken(consumerKey, consumerSecret)

  // The token is valid for about five minutes. Without an explicit expiry date
  // from the provider, assume a conservative four.
  const expiresAt = auth.expiryDate
    ? new Date(auth.expiryDate).getTime()
    : Date.now() + 4 * 60 * 1000

  cachedToken = { value: auth.token, expiresAt }
  return auth.token
}

/**
 * Get the notification id for an IPN URL, registering it if necessary.
 *
 * Tries the existing registrations first so restarting the app does not create
 * a duplicate entry for the same URL on the merchant's dashboard.
 */
export async function getNotificationId(
  token: string,
  ipnUrl: string,
): Promise<string> {
  if (cachedIpn && cachedIpn.url === ipnUrl) {
    return cachedIpn.notificationId
  }

  // Reuse an existing registration for this exact URL if there is one.
  try {
    const existing = await pesapalListIpn(token)
    const match = existing.find((entry) => entry.url?.replace(/\/+$/, '') === ipnUrl.replace(/\/+$/, ''))
    if (match?.ipnId) {
      cachedIpn = { notificationId: match.ipnId, url: ipnUrl }
      return match.ipnId
    }
  } catch {
    // Listing is best-effort; registration below is the fallback.
  }

  const registered = await pesapalRegisterIpn(token, ipnUrl, 'GET')

  // A registration without an id would be submitted as a missing
  // notification_id and the order would be rejected by PesaPal, so fail here
  // with a clear reason instead of sending a doomed request.
  if (!registered.ipnId) {
    throw new Error('PesaPal accepted the IPN registration but returned no id')
  }

  cachedIpn = { notificationId: registered.ipnId, url: ipnUrl }
  return registered.ipnId
}

/** Test seam: forget the cached token and IPN id. */
export function resetPesapalCache() {
  cachedToken = null
  cachedIpn = null
}
