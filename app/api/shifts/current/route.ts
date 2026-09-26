import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { errorResponse, successResponse, ErrorCodes } from '@/lib/api/response'

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
        cashTransactions: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    })

    if (!shift) {
      return successResponse({ shift: null })
    }

    return successResponse({ shift: formatShift(shift) })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to view current shift', 403, undefined, getPath(request))
    }
    console.error('GET /api/shifts/current error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Unable to load shift', 500, undefined, getPath(request))
  }
}