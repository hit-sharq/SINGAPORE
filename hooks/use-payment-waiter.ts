'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Watches a payment while the customer completes it on their own phone.
 *
 * The customer pays on a different device, so the waiter's screen cannot rely
 * on a browser redirect to learn the outcome. PesaPal's IPN updates the order
 * server-side, so polling the payment's status is enough.
 *
 * Mobile money commonly takes 10-30 seconds to confirm, so `PENDING` is a
 * normal state to sit in rather than a failure.
 */

export type WaitForPaymentOutcome = 'COMPLETED' | 'FAILED' | 'ABANDONED' | 'TIMED_OUT'

export interface PaymentWaitState {
  outcome: WaitForPaymentOutcome | null
  /** Seconds since the waiter started waiting, for the "still waiting" copy. */
  elapsed: number
  /** True while polling is in progress. */
  checking: boolean
  stop: () => void
}

const POLL_INTERVAL_MS = 4000
const TIMEOUT_MS = 5 * 60 * 1000

/**
 * @param orderId  order to watch
 * @param enabled  only poll while a payment request is actually outstanding
 * @param onSettled called once when the payment reaches a final state
 */
export function usePaymentWaiter(
  orderId: string | null,
  enabled: boolean,
  onSettled: (outcome: WaitForPaymentOutcome, status?: string) => void,
): PaymentWaitState {
  const [outcome, setOutcome] = useState<WaitForPaymentOutcome | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [checking, setChecking] = useState(false)
  const startedAt = useRef<number | null>(null)
  const settled = useRef(false)

  useEffect(() => {
    if (!orderId || !enabled) {
      startedAt.current = null
      settled.current = false
      setOutcome(null)
      setElapsed(0)
      return
    }

    startedAt.current = Date.now()
    settled.current = false
    setOutcome(null)
    setElapsed(0)

    const timer = window.setInterval(() => {
      if (startedAt.current) {
        setElapsed(Math.floor((Date.now() - startedAt.current) / 1000))
      }
    }, 1000)

    return () => window.clearInterval(timer)
  }, [orderId, enabled])

  useEffect(() => {
    if (!orderId || !enabled || settled.current) return

    let cancelled = false

    async function check() {
      setChecking(true)
      try {
        const res = await fetch(`/api/orders/${orderId}/payments`)
        if (!res.ok) return
        const json = await res.json()
        if (cancelled) return

        // Most recent payment first: the API returns newest at the top.
        const payments = json?.data?.payments ?? json?.payments ?? []
        const latest = payments[0]
        if (!latest) return

        if (latest.status === 'COMPLETED') {
          settled.current = true
          setOutcome('COMPLETED')
          onSettled('COMPLETED', 'COMPLETED')
        } else if (latest.status === 'FAILED') {
          settled.current = true
          setOutcome('FAILED')
          onSettled('FAILED', 'FAILED')
        }
      } catch {
        // A dropped poll is not a failure: the next tick tries again.
      } finally {
        if (!cancelled) setChecking(false)
      }
    }

    const interval = window.setInterval(check, POLL_INTERVAL_MS)
    // check once immediately so an instant payment shows straight away
    check()

    const timeout = window.setTimeout(() => {
      if (!settled.current) {
        settled.current = true
        setOutcome('TIMED_OUT')
        onSettled('TIMED_OUT')
      }
    }, TIMEOUT_MS)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.clearTimeout(timeout)
    }
  }, [orderId, enabled, onSettled])

  return {
    outcome,
    elapsed,
    checking,
    stop: () => {
      settled.current = true
    },
  }
}
