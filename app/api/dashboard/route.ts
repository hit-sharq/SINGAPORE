import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function GET() {
  try {
    await requireRole(Object.values(Role))
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const [orders, payments, tabs, tables, lowStock] = await Promise.all([
      prisma.order.aggregate({ where: { createdAt: { gte: start }, status: 'PAID' }, _sum: { total: true }, _count: true }),
      prisma.payment.groupBy({ by: ['method'], where: { createdAt: { gte: start }, status: 'COMPLETED' }, _sum: { amount: true } }),
      prisma.order.count({ where: { status: 'OPEN' } }),
      prisma.venueTable.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, status: true, capacity: true } }),
      prisma.product.findMany({ where: { status: 'ACTIVE' }, select: { id: true, name: true, stock: true, reorderAt: true }, orderBy: { stock: 'asc' }, take: 10 }),
    ])
    return NextResponse.json({
      revenue: orders._sum.total?.toString() ?? '0',
      orderCount: orders._count,
      activeTabs: tabs,
      paymentMix: payments.map((payment) => ({ method: payment.method, amount: payment._sum.amount?.toString() ?? '0' })),
      tables,
      lowStock: lowStock.filter((product) => product.stock.lessThanOrEqualTo(product.reorderAt)).map((product) => ({ ...product, stock: product.stock.toString(), reorderAt: product.reorderAt.toString() })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unable to load dashboard' }, { status: 500 })
  }
}
