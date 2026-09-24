import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const orderTrackingId = url.searchParams.get('OrderTrackingId')
  const merchantReference = url.searchParams.get('OrderMerchantReference')
  if (!orderTrackingId && !merchantReference) return NextResponse.json({ error: 'Missing transaction reference' }, { status: 400 })

  const transaction = orderTrackingId
    ? await prisma.pesapalTransaction.findFirst({ where: { pesapalOrderId: orderTrackingId } })
    : await prisma.pesapalTransaction.findUnique({ where: { merchantRef: merchantReference! } })
  if (!transaction) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })

  return NextResponse.json({ orderTrackingId, merchantReference, status: transaction.status })
}
