import { prisma } from '@/lib/prisma'
import { pesapalGetTransactionStatus, PesapalError } from '@/lib/pesapal'
import { getPesapalToken } from '@/lib/pesapal-cache'
import { resolveStoredSecret } from '@/lib/security'
import { PaymentStatus } from '@prisma/client'

/**
 * Inbound PesaPal notification handling.
 *
 * PesaPal sends no signature on its IPN, so a notification cannot be proven
 * genuine by inspecting it. Instead the notification is treated as a pointer:
 * we look up the transaction reference, then ask PesaPal directly what the
 * real status is, and act only on PesaPal's answer.
 *
 * A forged notification therefore has nothing to forge — an invented
 * transaction id does not exist on PesaPal's side, and an amount that does not
 * match the stored transaction is refused.
 */

export type VerifiedStatus = 'COMPLETED' | 'FAILED' | 'PENDING' | 'REFUNDED' | 'UNKNOWN'

export interface VerificationResult {
  ok: boolean
  reason?: string
  status?: VerifiedStatus
  amount?: number
  currency?: string
  merchantRef?: string
}

/**
 * Resolve the merchant credentials. Environment wins, then the admin-saved
 * settings (which are stored encrypted).
 */
export async function getPesapalCredentials(): Promise<{
  consumerKey: string
  consumerSecret: string
} | null> {
  const [keySetting, secretSetting] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: 'pesapal_consumer_key' } }),
    prisma.appSetting.findUnique({ where: { key: 'pesapal_consumer_secret' } }),
  ])

  const consumerKey = process.env.PESAPAL_CONSUMER_KEY || keySetting?.value || ''
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET || resolveStoredSecret(secretSetting?.value)

  if (!consumerKey || !consumerSecret) return null
  return { consumerKey, consumerSecret }
}

/**
 * Whether two amounts are the same to the cent.
 *
 * Works in integer cents. Doing this with float subtraction looks equivalent
 * but is not: 5000.01 - 5000 evaluates to 0.010000000000047, so a real payment
 * that is correct to the cent would be refused.
 */
export function amountsMatch(expected: number, reported: number): boolean {
  const toCents = (value: number) => Math.round(value * 100)
  return toCents(expected) === toCents(reported)
}

/** PesaPal reports its status with a description alongside the code. */
function normaliseStatus(raw: unknown): VerifiedStatus {
  if (typeof raw !== 'string') return 'UNKNOWN'
  const value = raw.trim().toUpperCase()
  if (value === 'COMPLETED') return 'COMPLETED'
  if (value === 'FAILED' || value === 'INVALID') return 'FAILED'
  if (value === 'PENDING') return 'PENDING'
  if (value === 'REFUNDED' || value === 'REVERSED') return 'REFUNDED'
  return 'UNKNOWN'
}

/**
 * Ask PesaPal what actually happened to a transaction.
 *
 * `expectedAmount` is the amount we recorded when the payment was created. If
 * PesaPal reports a different figure the notification is refused: that is the
 * check that stops a notification for a genuine but unrelated transaction from
 * being applied to this order.
 */
export async function verifyTransactionWithPesapal(
  pesapalOrderId: string,
  expectedAmount: number,
): Promise<VerificationResult> {
  const credentials = await getPesapalCredentials()
  if (!credentials) {
    return { ok: false, reason: 'PesaPal credentials are not configured' }
  }

  let token: string
  try {
    token = await getPesapalToken(credentials.consumerKey, credentials.consumerSecret)
  } catch (error) {
    const message = error instanceof PesapalError ? error.message : 'PesaPal auth failed'
    return { ok: false, reason: message }
  }

  let transaction
  try {
    transaction = await pesapalGetTransactionStatus(token, pesapalOrderId)
  } catch (error) {
    // A 404 means the tracking id does not exist, which is exactly what a
    // forged notification looks like.
    const notFound = error instanceof PesapalError && error.status === 404
    return {
      ok: false,
      reason: notFound ? 'Transaction not found at PesaPal' : 'PesaPal status check failed',
    }
  }

  const status = normaliseStatus(
    transaction.payment_status_description ??
      transaction.payment_status ??
      transaction.status
  )

  const amount = Number(transaction.amount)
  if (!Number.isFinite(amount)) {
    return { ok: false, reason: 'PesaPal did not report an amount' }
  }

  // Guard against a notification being replayed against a different order.
  //
  // Compared in integer cents rather than as floats: 5000.01 - 5000 is
  // 0.010000000000047 in binary floating point, which would reject a genuine
  // payment that is correct to the cent.
  if (!amountsMatch(expectedAmount, amount)) {
    return {
      ok: false,
      reason: `Amount mismatch: expected ${expectedAmount}, PesaPal reports ${amount}`,
    }
  }

  return {
    ok: true,
    status,
    amount,
    currency: transaction.currency,
    merchantRef: transaction.merchant_reference,
  }
}

/** Map a verified PesaPal status onto our payment status. */
export function toPaymentStatus(status: VerifiedStatus | undefined): PaymentStatus | null {
  switch (status) {
    case 'COMPLETED':
      return PaymentStatus.COMPLETED
    case 'FAILED':
      return PaymentStatus.FAILED
    case 'REFUNDED':
      return PaymentStatus.REFUNDED
    case 'PENDING':
    case 'UNKNOWN':
    default:
      return null
  }
}
