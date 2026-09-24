import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role, OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client'

export async function GET(request: Request) {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER])
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const start = date ? new Date(date) : new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)

    const [
      orders,
      payments,
      categories,
      hourlyData,
      topProducts,
      voids,
      refunds,
    ] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: start, lt: end } },
        include: { items: { include: { product: true } }, payments: true, table: true },
      }),
      prisma.payment.findMany({
        where: { createdAt: { gte: start, lt: end }, status: 'COMPLETED' },
        include: { order: true },
      }),
      prisma.category.findMany({
        include: { products: { where: { status: 'ACTIVE' } } },
      }),
      prisma.$queryRaw`
        SELECT EXTRACT(HOUR FROM "createdAt")::int as hour, COUNT(*)::int as orders, COALESCE(SUM("total")::text, '0') as revenue
        FROM "Order" WHERE "createdAt" >= ${start} AND "createdAt" < ${end}
        GROUP BY EXTRACT(HOUR FROM "createdAt") ORDER BY hour
      ` as unknown as { hour: number; orders: number; revenue: string }[],
      prisma.$queryRaw`
        SELECT p.name, SUM(oi.quantity)::int as sold, COALESCE(SUM(oi."totalPrice")::text, '0') as revenue
        FROM "OrderItem" oi JOIN "Product" p ON oi."productId" = p.id
        JOIN "Order" o ON oi."orderId" = o.id
        WHERE o."createdAt" >= ${start} AND o."createdAt" < ${end} AND o.status = 'PAID'
        GROUP BY p.name ORDER BY sold DESC LIMIT 10
      ` as unknown as { name: string; sold: number; revenue: string }[],
      prisma.order.count({ where: { createdAt: { gte: start, lt: end }, status: 'VOID' } }),
      prisma.order.count({ where: { createdAt: { gte: start, lt: end }, status: 'REFUNDED' } }),
    ])

    const paidOrders = orders.filter((o) => o.status === 'PAID')
    const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total), 0)
    const paymentMix = payments.reduce((acc, p) => {
      const key = p.method
      acc[key] = (acc[key] || 0) + Number(p.amount)
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      date: start.toISOString().split('T')[0],
      revenue: totalRevenue.toString(),
      orderCount: paidOrders.length,
      avgOrderValue: paidOrders.length ? (totalRevenue / paidOrders.length).toFixed(2) : '0',
      voids,
      refunds,
      paymentMix: Object.entries(paymentMix).map(([method, amount]) => ({ method, amount: amount.toString() })),
      hourly: hourlyData.map((h) => ({ hour: h.hour, orders: h.orders, revenue: h.revenue })),
      topProducts: topProducts.map((p) => ({ name: p.name, sold: p.sold, revenue: p.revenue })),
      orders: orders.map((o) => ({
        id: o.id,
        number: o.number,
        status: o.status,
        total: o.total.toString(),
        table: o.table?.name ?? null,
        items: o.items.map((i) => ({
          name: i.product.name,
          qty: i.quantity,
          price: i.unitPrice.toString(),
        })),
        payments: o.payments.map((p) => ({ method: p.method, amount: p.amount.toString(), status: p.status })),
        createdAt: o.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unable to load daily report' }, { status: 500 })
  }
}