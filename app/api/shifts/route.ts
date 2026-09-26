import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { errorResponse, createdResponse, successResponse, ErrorCodes } from '@/lib/api/response'

const openShiftSchema = z.object({
  openingCash: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format').default('0'),
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

export async function GET(request: NextRequest) {
  try {
    const staff = await requireRole(Object.values(Role))
    const shift = await prisma.shift.findFirst({
      where: { userId: staff.id, status: 'OPEN' },
      include: {
        cashDrawer: true,
        cashTransactions: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!shift) {
      return successResponse({ shift: null })
    }

    return successResponse({ shift: formatShift(shift) })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to view shifts', 403, undefined, getPath(request))
    }
    console.error('GET /api/shifts error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Unable to load shift', 500, undefined, getPath(request))
  }
}

export async function POST(request: NextRequest) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER, Role.CASHIER, Role.BARTENDER, Role.WAITER])
    const body = await request.json()
    const parsed = openShiftSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid shift data', 400, parsed.error.issues, getPath(request))
    }

    const { openingCash } = parsed.data

    const existingShift = await prisma.shift.findFirst({
      where: { userId: staff.id, status: 'OPEN' },
    })
    if (existingShift) {
      return errorResponse(ErrorCodes.CONFLICT, 'You already have an open shift', 400, { field: 'shift' }, getPath(request))
    }

    const shift = await prisma.$transaction(async (tx) => {
      const created = await tx.shift.create({
        data: {
          userId: staff.id,
          startsAt: new Date(),
          status: 'OPEN',
          openingCash: openingCash,
        },
      })

      await tx.cashDrawer.create({
        data: {
          shiftId: created.id,
          balance: openingCash,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: staff.id,
          action: 'OPEN_SHIFT',
          entity: 'Shift',
          entityId: created.id,
          metadata: { openingCash },
        },
      })

      return created
    })

    return createdResponse({ shift: formatShift(shift) })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to open shifts', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid shift data', 400, error.issues, getPath(request))
    }
    console.error('POST /api/shifts error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to open shift', 500, undefined, getPath(request))
  }
}