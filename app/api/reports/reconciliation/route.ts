import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role, PaymentStatus, PaymentMethod } from '@prisma/client'
import { errorResponse, successResponse, ErrorCodes } from '@/lib/api/response'

function getPath(request: NextRequest): string {
  return request.nextUrl.pathname
}

export async function GET(request: NextRequest) {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER])
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const start = date ? new Date(date) : new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)

    const [
      payments,
      pesapalPayments,
      cardPayments,
      cashPayments,
      shifts,
      cashDrawers,
    ] = await Promise.all([
      prisma.payment.findMany({
        where: { createdAt: { gte: start, lt: end } },
        include: { order: { select: { id: true, number: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.payment.findMany({
        where: { createdAt: { gte: start, lt: end }, method: 'PESAPAL', status: 'COMPLETED' },
      }),
      prisma.payment.findMany({
        where: { createdAt: { gte: start, lt: end }, method: 'CARD', status: 'COMPLETED' },
      }),
      prisma.payment.findMany({
        where: { createdAt: { gte: start, lt: end }, method: 'CASH', status: 'COMPLETED' },
      }),
      prisma.shift.findMany({
        where: { startsAt: { gte: start, lt: end } },
        include: { cashDrawer: true, cashTransactions: true, user: { select: { name: true } } },
      }),
      prisma.cashDrawer.findMany({
        where: { shift: { startsAt: { gte: start, lt: end } } },
        include: { shift: { select: { id: true, userId: true } } },
      }),
    ])

    const pesapalTotal = pesapalPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    const cardTotal = cardPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    const cashTotal = cashPayments.reduce((sum, p) => sum + Number(p.amount), 0)

    const shiftSummaries = shifts.map((s) => ({
      id: s.id,
      user: s.user.name,
      opensAt: s.startsAt.toISOString(),
      closesAt: s.endsAt?.toISOString() ?? null,
      openingCash: s.openingCash.toString(),
      closingCash: s.closingCash?.toString() ?? null,
      expectedCash: s.cashDrawer?.balance.toString() ?? '0',
      cashTransactions: s.cashTransactions.map((t) => ({
        type: t.type,
        amount: t.amount.toString(),
        reason: t.reason,
      })),
    }))

    const failedPayments = payments.filter((p) => p.status === 'FAILED')
    const pendingPayments = payments.filter((p) => p.status === 'PENDING')

    return successResponse({
      date: start.toISOString().split('T')[0],
      totals: {
        pesapal: pesapalTotal.toString(),
        card: cardTotal.toString(),
        cash: cashTotal.toString(),
        grand: (pesapalTotal + cardTotal + cashTotal).toString(),
      },
      counts: {
        pesapal: pesapalPayments.length,
        card: cardPayments.length,
        cash: cashPayments.length,
        failed: failedPayments.length,
        pending: pendingPayments.length,
      },
      shifts: shiftSummaries,
      cashDrawers: cashDrawers.map((d) => ({
        shiftId: d.shift.id,
        balance: d.balance.toString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
      discrepancies: payments
        .filter((p) => p.status === 'FAILED' || p.status === 'PENDING')
        .map((p) => ({
          id: p.id,
          order: p.order.number,
          method: p.method,
          amount: p.amount.toString(),
          status: p.status,
          externalRef: p.externalRef ?? null,
          createdAt: p.createdAt.toISOString(),
        })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to view reconciliation report', 403, undefined, getPath(request))
    }
    console.error('GET /api/reports/reconciliation error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Unable to load reconciliation report', 500, undefined, getPath(request))
  }
}