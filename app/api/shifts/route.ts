import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

const openShiftSchema = z.object({
  openingCash: z.string().regex(/^\d+(\.\d{1,2})?$/).default('0'),
})

const cashTransactionSchema = z.object({
  type: z.enum(['SALE', 'REFUND', 'PAYOUT', 'DROP', 'TIP_IN', 'TIP_OUT', 'OTHER']),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  reason: z.string().min(1),
})

export async function GET() {
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
      return NextResponse.json({ shift: null })
    }

    return NextResponse.json({
      ...shift,
      openingCash: shift.openingCash.toString(),
      closingCash: shift.closingCash?.toString() ?? null,
      cashDrawer: shift.cashDrawer
        ? { ...shift.cashDrawer, balance: shift.cashDrawer.balance.toString() }
        : null,
      cashTransactions: shift.cashTransactions.map((t) => ({
        ...t,
        amount: t.amount.toString(),
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unable to load shift' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER, Role.CASHIER, Role.BARTENDER, Role.WAITER])
    const body = await request.json()
    const { openingCash } = openShiftSchema.parse(body)

    const existingShift = await prisma.shift.findFirst({
      where: { userId: staff.id, status: 'OPEN' },
    })
    if (existingShift) {
      return NextResponse.json({ error: 'You already have an open shift' }, { status: 400 })
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

    return NextResponse.json({ ...shift, openingCash: shift.openingCash.toString() }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: 'Unable to open shift' }, { status: 500 })
  }
}