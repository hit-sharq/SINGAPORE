import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { errorResponse, createdResponse, successResponse, ErrorCodes } from '@/lib/api/response'

const closeShiftSchema = z.object({
  closingCash: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
})

const cashTransactionSchema = z.object({
  type: z.enum(['SALE', 'REFUND', 'PAYOUT', 'DROP', 'TIP_IN', 'TIP_OUT', 'OTHER']),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
  reason: z.string().min(1, 'Reason is required'),
})

function getPath(request: NextRequest): string {
  return request.nextUrl.pathname
}

function formatShift(shift: any) {
  return {
    ...shift,
    openingCash: shift.openingCash.toString(),
    closingCash: shift.closingCash?.toString() ?? null,
    cashDrawer: shift.cashDrawer
      ? { ...shift.cashDrawer, balance: shift.cashDrawer.balance.toString() }
      : null,
    cashTransactions: shift.cashTransactions?.map((t: any) => ({
      ...t,
      amount: t.amount.toString(),
    })) ?? [],
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER, Role.CASHIER, Role.BARTENDER, Role.WAITER])
    const { id } = await params
    const body = await request.json()
    const parsed = closeShiftSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid close shift data', 400, parsed.error.issues, getPath(request))
    }

    const { closingCash } = parsed.data

    const shift = await prisma.shift.findUnique({
      where: { id },
      include: { cashDrawer: true, cashTransactions: true },
    })
    if (!shift) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Shift not found', 404, undefined, getPath(request))
    }
    if (shift.userId !== staff.id && !staff.roles.includes(Role.ADMIN) && !staff.roles.includes(Role.MANAGER)) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You can only close your own shifts', 403, undefined, getPath(request))
    }
    if (shift.status !== 'OPEN') {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Shift is not open', 400, { field: 'status' }, getPath(request))
    }

    const expectedCash = shift.cashDrawer
      ? shift.cashDrawer.balance.plus(closingCash)
      : Number(closingCash)

    const [updatedShift] = await prisma.$transaction([
      prisma.shift.update({
        where: { id },
        data: {
          endsAt: new Date(),
          status: 'CLOSED',
          closingCash: closingCash,
        },
      }),
      prisma.cashDrawer.update({
        where: { shiftId: id },
        data: { balance: expectedCash },
      }),
      prisma.auditLog.create({
        data: {
          userId: staff.id,
          action: 'CLOSE_SHIFT',
          entity: 'Shift',
          entityId: id,
          metadata: { closingCash, expectedCash: expectedCash.toString() },
        },
      }),
    ])

    return successResponse({ shift: formatShift(updatedShift) })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You can only close your own shifts', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid close shift data', 400, error.issues, getPath(request))
    }
    console.error('PATCH /api/shifts/[id] error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to close shift', 500, undefined, getPath(request))
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER, Role.CASHIER, Role.BARTENDER, Role.WAITER])
    const { id } = await params
    const body = await request.json()
    const parsed = cashTransactionSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid transaction data', 400, parsed.error.issues, getPath(request))
    }

    const { type, amount, reason } = parsed.data

    const shift = await prisma.shift.findUnique({
      where: { id },
      include: { cashDrawer: true },
    })
    if (!shift) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Shift not found', 404, undefined, getPath(request))
    }
    if (shift.userId !== staff.id && !staff.roles.includes(Role.ADMIN) && !staff.roles.includes(Role.MANAGER)) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You can only record transactions on your own shifts', 403, undefined, getPath(request))
    }
    if (shift.status !== 'OPEN') {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Shift is not open', 400, { field: 'status' }, getPath(request))
    }

    const isInflow = ['SALE', 'TIP_IN'].includes(type)
    const amountNum = Number(amount)
    const currentBalance = shift.cashDrawer ? Number(shift.cashDrawer.balance) : 0
    const newBalance = currentBalance + (isInflow ? amountNum : -amountNum)

    if (newBalance < 0) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Insufficient cash in drawer', 400, { field: 'amount' }, getPath(request))
    }

    const [transaction] = await prisma.$transaction([
      prisma.cashTransaction.create({
        data: {
          shiftId: id,
          type,
          amount: amountNum,
          reason,
        },
      }),
      prisma.cashDrawer.update({
        where: { shiftId: id },
        data: { balance: newBalance },
      }),
    ])

    return createdResponse({ ...transaction, amount: transaction.amount.toString() })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You can only record transactions on your own shifts', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid transaction data', 400, error.issues, getPath(request))
    }
    console.error('POST /api/shifts/[id] error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to record transaction', 500, undefined, getPath(request))
  }
}