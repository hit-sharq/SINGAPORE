'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

/**
 * Renders a payment link as a scannable QR code.
 *
 * Used for the waiter-to-customer flow: the waiter opens the order, the
 * customer scans this with their own phone and pays with M-Pesa or Airtel, and
 * the waiter's device only watches for the result. The customer never has to
 * touch the waiter's phone, and never sees the waiter's screen.
 *
 * Encoding uses the maintained `qrcode` package rather than a hand-written
 * encoder — a subtly wrong QR code looks fine and simply will not scan, which
 * on a busy floor means a table cannot pay.
 */
export function PaymentQrCode({
  value,
  size = 208,
  className,
}: {
  value: string
  size?: number
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !value) return

    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 2,
      // High correction so the code still scans with screen glare or a smudged
      // phone camera, which matters on a dim club floor.
      errorCorrectionLevel: 'H',
      color: {
        dark: '#111210',
        light: '#ffffff',
      },
    })
      .then(() => setError(null))
      .catch(() => setError('Could not generate the payment code'))
  }, [value, size])

  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-center text-xs text-red-200 ${className ?? ''}`}
        style={{ width: size, height: size }}
      >
        {error}. Use the link below instead.
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`rounded-lg bg-white ${className ?? ''}`}
      aria-label="Payment QR code"
      role="img"
    />
  )
}
