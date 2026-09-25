/**
 * PesaPal API service.
 * Documentation: https://developer.pesapal.com
 */

const PESAPAL_API_BASE = process.env.PESAPAL_API_BASE || 'https://api.pesapal.com'

export class PesapalError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'PesapalError'
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
  const res = await fetch(`${PESAPAL_API_BASE}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ consumer_key: consumerKey, consumer_secret: consumerSecret }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new PesapalError(`PesaPal auth failed: ${res.status} ${text}`, res.status)
  }
  return res.json()
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
  const res = await fetch(`${PESAPAL_API_BASE}/api/PesapalAPI`, {
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
    }),
  })
  const data: SubmitOrderResult = await res.json()
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
}

export async function pesapalGetTransactionStatus(
  token: string,
  pesapalOrderId: string
): Promise<TransactionStatus> {
  const res = await fetch(
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
  return res.json()
}