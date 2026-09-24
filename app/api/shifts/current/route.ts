import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function GET() {
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