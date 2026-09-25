import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

const closeShiftSchema = z.object({
  closingCash: z.string().regex(/^\d+(\.\d{1,2})?$/),
})

const cashTransactionSchema = z.object({
  type: z.enum(['SALE', 'REFUND', 'PAYOUT', 'DROP', 'TIP_IN', 'TIP_OUT', 'OTHER']),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  reason: z.string().min(1),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER, Role.CASHIER, Role.BARTENDER, Role.WAITER])
    const { id } = await params
    const body = await request.json()
    const { closingCash } = closeShiftSchema.parse(body)

    const shift = await prisma.shift.findUnique({
      where: { id },
      include: { cashDrawer: true, cashTransactions: true },
    })
    if (!shift) return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    if (shift.userId !== staff.id && !staff.roles.includes(Role.ADMIN) && !staff.roles.includes(Role.MANAGER)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (shift.status !== 'OPEN') {
      return NextResponse.json({ error: 'Shift is not open' }, { status: 400 })
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

    return NextResponse.json({ ...updatedShift, openingCash: updatedShift.openingCash.toString(), closingCash: updatedShift.closingCash?.toString() ?? null })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: 'Unable to close shift' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER, Role.CASHIER, Role.BARTENDER, Role.WAITER])
    const { id } = await params
    const body = await request.json()
    const { type, amount, reason } = cashTransactionSchema.parse(body)

    const shift = await prisma.shift.findUnique({
      where: { id },
      include: { cashDrawer: true },
    })
    if (!shift) return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    if (shift.userId !== staff.id && !staff.roles.includes(Role.ADMIN) && !staff.roles.includes(Role.MANAGER)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (shift.status !== 'OPEN') {
      return NextResponse.json({ error: 'Shift is not open' }, { status: 400 })
    }

    const isInflow = ['SALE', 'TIP_IN'].includes(type)
    const amountNum = Number(amount)
    const currentBalance = shift.cashDrawer ? Number(shift.cashDrawer.balance) : 0
    const newBalance = currentBalance + (isInflow ? amountNum : -amountNum)

    if (newBalance < 0) {
      return NextResponse.json({ error: 'Insufficient cash in drawer' }, { status: 400 })
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

    return NextResponse.json({ ...transaction, amount: transaction.amount.toString() }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: 'Unable to record transaction' }, { status: 500 })
  }
}