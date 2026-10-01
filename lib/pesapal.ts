/**
 * PesaPal API service.
 * Documentation: https://developer.pesapal.com
 */

const PESAPAL_API_BASE = process.env.PESAPAL_API_BASE || 'https://api.pesapal.com'

/**
 * Every call to PesaPal is bounded. Without this, a stalled connection leaves
 * the waiter watching a spinner on a payment that will never resolve, and the
 * order is left holding a PENDING payment nobody can explain.
 */
const PESAPAL_TIMEOUT_MS = 20_000

export class PesapalError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'PesapalError'
  }
}

/** fetch with a deadline, so a hang surfaces as an error the caller can act on. */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = PESAPAL_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new PesapalError(`PesaPal did not respond within ${timeoutMs / 1000}s`)
    }
    // A network-level failure: DNS, TLS, or the connection dropping.
    const detail = error instanceof Error ? error.message : String(error)
    throw new PesapalError(`Could not reach PesaPal: ${detail}`)
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Read a JSON body, turning anything unparseable into a PesapalError.
 *
 * A proxy, a captive portal or an outage can return HTML instead of JSON, and
 * the resulting SyntaxError is not a PesapalError — so it escaped the payment
 * route's error handling and surfaced as a 500 instead of a gateway failure.
 */
async function readJson<T>(res: Response, what: string): Promise<T> {
  const text = await res.text()
  try {
    return JSON.parse(text) as T
  } catch {
    const preview = text.replace(/\s+/g, ' ').trim().slice(0, 120)
    throw new PesapalError(
      `PesaPal returned an unexpected response for ${what} (HTTP ${res.status}): ${preview || 'empty body'}`,
      res.status,
    )
  }
}

export interface PesapalAuth {
  token: string
  expiry: string
}

export async function pesapalGetAuthToken(
  consumerKey: string,
  consumerSecret: string
): Promise<PesapalAuth> {
  const res = await fetchWithTimeout(`${PESAPAL_API_BASE}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ consumer_key: consumerKey, consumer_secret: consumerSecret }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new PesapalError(`PesaPal auth failed: ${res.status} ${text}`, res.status)
  }
  return readJson<PesapalAuth>(res, 'authentication')
}

export interface SubmitOrderParams {
  consumerKey: string
  consumerSecret: string
  merchantRef: string
  amount: number
  currency: string
  description: string
  callbackUrl: string
  notificationUrl: string
  redirectUrl: string
  /**
   * The payer's mobile number, already normalised to 2547XXXXXXXX.
   *
   * PesaPal uses this to prefill the payment page, so the customer confirms the
   * number on their own phone rather than being asked to type it after scanning
   * a code. That is what turns a scan into a one-tap STK prompt.
   */
  payerPhone?: string
  branch?: string
}

export interface SubmitOrderResult {
  pesapal_transaction_id: string
  redirect_url: string
  status: string
  error?: string
  message?: string
}

export async function pesapalSubmitOrder(
  params: SubmitOrderParams
): Promise<SubmitOrderResult> {
  const res = await fetchWithTimeout(`${PESAPAL_API_BASE}/api/PesapalAPI`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pesapal_consumer_key: params.consumerKey,
      pesapal_consumer_secret: params.consumerSecret,
      merchant_ref: params.merchantRef,
      amount: params.amount,
      currency: params.currency,
      description: params.description,
      callback_url: params.callbackUrl,
      notification_url: params.notificationUrl,
      redirect_url: params.redirectUrl,
      branch: params.branch,
      // Prefills the payment page so the customer does not have to type their
      // own number on a phone they are already holding.
      billing_address: params.payerPhone
        ? {
            phone_number: params.payerPhone,
            country_code: 'KE',
            email_address: '',
            first_name: '',
            middle_name: '',
            last_name: '',
          }
        : undefined,
    }),
  })
  const data: SubmitOrderResult = await readJson<SubmitOrderResult>(res, 'order submission')
  if (!res.ok || data.error) {
    throw new PesapalError(
      data.message || data.error || `PesaPal submit failed: ${res.status}`,
      res.status
    )
  }
  if (!data.redirect_url) {
    throw new PesapalError('PesaPal returned no redirect URL')
  }
  return data
}

export interface TransactionStatus {
  pesapal_transaction_id: string
  merchant_ref: string
  status: string
  amount: number
  currency: string
  /* PesaPal reports the status under a couple of different keys depending on
     the endpoint and version, so both are accepted. */
  payment_status_description?: string
  payment_status?: string
}

export async function pesapalGetTransactionStatus(
  token: string,
  pesapalOrderId: string
): Promise<TransactionStatus> {
  const res = await fetchWithTimeout(
    `${PESAPAL_API_BASE}/api/PesapalAPI?pesapal_transaction_id=${encodeURIComponent(pesapalOrderId)}`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new PesapalError(`PesaPal status check failed: ${res.status} ${text}`, res.status)
  }
  return readJson<TransactionStatus>(res, 'transaction status')
}