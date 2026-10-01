/**
 * PesaPal API 3.0 client.
 * Documentation: https://developer.pesapal.com
 *
 * API 3.0 lives on different hosts and paths to the old API 2.0 XML
 * integration. Calling the 2.0 paths on api.pesapal.com does not return an
 * error — it 302s to a marketing "not found" page, which surfaced to staff as
 * a wall of HTML. The hosts below are the documented ones:
 *
 *   Live:     https://pay.pesapal.com/v3/api
 *   Sandbox:  https://cybqa.pesapal.com/pesapalv3/api
 */

const LIVE_BASE = 'https://pay.pesapal.com/v3/api'
const SANDBOX_BASE = 'https://cybqa.pesapal.com/pesapalv3/api'

/**
 * Resolved from PESAPAL_API_BASE so the environment can choose live or sandbox.
 * A value that is not one of the two known hosts is honoured, because a
 * self-hosted proxy or a future Pesapal host should not be blocked.
 */
export function pesapalApiBase(): string {
  const configured = process.env.PESAPAL_API_BASE?.trim()

  if (!configured) return LIVE_BASE
  if (configured.includes('cybqa.pesapal.com')) return SANDBOX_BASE
  if (configured.includes('pay.pesapal.com')) return LIVE_BASE

  return configured.replace(/\/+$/, '')
}

/** True when the configured environment is the demo/sandbox one. */
export function isSandbox(): boolean {
  return pesapalApiBase().includes('cybqa.pesapal.com')
}

/**
 * Every call to PesaPal is bounded. Without this a stalled connection leaves a
 * waiter watching a spinner on a payment that will never resolve, and the order
 * is left holding a PENDING payment nobody can explain.
 */
const PESAPAL_TIMEOUT_MS = 20_000

export class PesapalError extends Error {
  constructor(
    message: string,
    public status?: number,
    /** Maps to a staff-facing code in lib/errors.ts. */
    public staffCode: 'PAYMENT_PROVIDER_ERROR' | 'PAYMENT_TIMEOUT' | 'PAYMENT_NOT_CONFIGURED' =
      'PAYMENT_PROVIDER_ERROR',
  ) {
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
    return await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new PesapalError(
        `PesaPal did not respond within ${timeoutMs / 1000}s`,
        undefined,
        'PAYMENT_TIMEOUT',
      )
    }
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
    // A 302 to an HTML page lands here. Say so plainly, because it means the
    // endpoint is wrong rather than the payment being declined.
    const preview = text.replace(/\s+/g, ' ').trim().slice(0, 80)
    throw new PesapalError(
      `PesaPal returned a non-JSON response for ${what} (HTTP ${res.status}). ` +
        `This usually means the API base URL is wrong. Received: ${preview || 'empty body'}`,
      res.status,
    )
  }
}

/* ---------- authentication ---------- */

export interface PesapalAuth {
  token: string
  expiryDate?: string
}

/**
 * Request a bearer token. Valid for about five minutes, so callers should
 * cache it rather than fetching one per request.
 */
export async function pesapalGetAuthToken(
  consumerKey: string,
  consumerSecret: string,
): Promise<PesapalAuth> {
  if (!consumerKey || !consumerSecret) {
    throw new PesapalError('PesaPal credentials are not configured', undefined, 'PAYMENT_NOT_CONFIGURED')
  }

  const res = await fetchWithTimeout(`${pesapalApiBase()}/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ consumer_key: consumerKey, consumer_secret: consumerSecret }),
  })

  const data = await readJson<{ token?: string; expiryDate?: string; message?: string }>(
    res,
    'authentication',
  )

  if (!res.ok || !data.token) {
    throw new PesapalError(
      data.message || `PesaPal authentication failed (HTTP ${res.status}). Check the consumer key and secret.`,
      res.status,
    )
  }

  return { token: data.token, expiryDate: data.expiryDate }
}

/* ---------- IPN registration ---------- */

export interface RegisterIpnResult {
  ipnId: string
  url: string
}

/**
 * Register the IPN URL and return the notification_id.
 *
 * API 3.0 requires a notification_id on every order rather than a URL, so the
 * URL has to be registered before the first payment can be submitted.
 */
export async function pesapalRegisterIpn(
  token: string,
  url: string,
  notificationType: 'GET' | 'POST' = 'GET',
): Promise<RegisterIpnResult> {
  const res = await fetchWithTimeout(`${pesapalApiBase()}/URLSetup/RegisterIPN`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      url,
      ipn_notification_type: notificationType,
      is_active: true,
    }),
  })

  const data = await readJson<{ ipn_id?: string; url?: string; message?: string }>(
    res,
    'IPN registration',
  )

  if (!res.ok || !data.ipn_id) {
    throw new PesapalError(
      data.message || `Could not register the IPN URL (HTTP ${res.status})`,
      res.status,
    )
  }

  return { ipnId: data.ipn_id, url: data.url ?? url }
}

/** List registered IPN URLs, so an existing registration can be reused. */
export async function pesapalListIpn(token: string): Promise<RegisterIpnResult[]> {
  const res = await fetchWithTimeout(`${pesapalApiBase()}/Notifications/GetIPNList`, {
    method: 'GET',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  })

  if (!res.ok) return []
  const data = await readJson<{ results?: RegisterIpnResult[] }>(res, 'IPN list')
  return data.results ?? []
}

/* ---------- order submission ---------- */

export interface SubmitOrderParams {
  /** The merchant reference. Alphanumeric, dashes, underscores, dots, colons only. */
  merchantRef: string
  amount: number
  currency: string
  description: string
  callbackUrl: string
  /** Required by API 3.0: the id returned when the IPN URL was registered. */
  notificationId: string
  redirectUrl: string
  /** Already normalised to 2547XXXXXXXX; prefills the payment page. */
  payerPhone?: string
  branch?: string
}

export interface SubmitOrderResult {
  order_tracking_id: string
  merchant_reference: string
  redirect_url: string
  status?: string
  error?: unknown
  message?: string
}

/**
 * A merchant reference may only contain alphanumerics, dashes, underscores,
 * dots and colons, and at most 50 characters. Pesapal rejects anything else,
 * so it is sanitised here rather than letting a bad reference fail at the
 * gateway. The dash and the value are preserved so references stay traceable
 * back to an order number.
 */
export function sanitiseMerchantRef(ref: string): string {
  const cleaned = ref.replace(/[^A-Za-z0-9\-_.:]/g, '-').slice(0, 50)
  return cleaned || `REF-${Date.now()}`
}

export async function pesapalSubmitOrder(
  params: SubmitOrderParams,
  token: string,
): Promise<SubmitOrderResult> {
  const res = await fetchWithTimeout(`${pesapalApiBase()}/Transactions/SubmitOrderRequest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id: sanitiseMerchantRef(params.merchantRef),
      amount: params.amount,
      currency: params.currency,
      description: params.description.slice(0, 100),
      callback_url: params.callbackUrl,
      redirect_url: params.redirectUrl,
      notification_id: params.notificationId,
      branch: params.branch,
      billing_address: {
        // API 3.0 requires either a phone number or an email. The number is
        // what prefills the page and produces the STK prompt.
        phone_number: params.payerPhone ?? '',
        email_address: '',
        country_code: 'KE',
        first_name: '',
        middle_name: '',
        last_name: '',
        line_1: '',
        line_2: '',
        city: '',
        state: '',
        postal_code: '',
        zip_code: '',
      },
    }),
  })

  const data = await readJson<SubmitOrderResult>(res, 'order submission')

  if (!res.ok || data.error) {
    throw new PesapalError(
      data.message || `PesaPal declined to create the order (HTTP ${res.status})`,
      res.status,
    )
  }

  if (!data.redirect_url || !data.order_tracking_id) {
    throw new PesapalError('PesaPal accepted the order but returned no payment link', res.status)
  }

  return data
}

/* ---------- transaction status ---------- */

export interface TransactionStatus {
  order_tracking_id: string
  merchant_reference: string
  /** e.g. COMPLETED, FAILED, INVALID, REVERSED, PENDING */
  payment_status_description?: string
  payment_status?: string
  status?: string
  amount: number
  currency: string
  payment_method?: string
  confirmation_code?: string
  payment_account?: string
  /** 0 INVALID, 1 COMPLETED, 2 FAILED, 3 REVERSED */
  status_code?: number
}

export async function pesapalGetTransactionStatus(
  token: string,
  pesapalOrderId: string,
): Promise<TransactionStatus> {
  const res = await fetchWithTimeout(
    // The parameter is orderTrackingId. pesapal_transaction_id is the API 2.0
    // name and returns a 404 HTML page here.
    `${pesapalApiBase()}/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(pesapalOrderId)}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    },
  )

  if (res.status === 404) {
    // A tracking id Pesapal has never seen, which is what a forged
    // notification looks like.
    throw new PesapalError('Transaction not found at PesaPal', 404)
  }

  if (!res.ok) {
    const text = await res.text()
    throw new PesapalError(`PesaPal status check failed (HTTP ${res.status}) ${text.slice(0, 120)}`, res.status)
  }

  return readJson<TransactionStatus>(res, 'transaction status')
}
