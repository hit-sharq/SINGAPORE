import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role, OrderStatus, PaymentStatus } from '@prisma/client'
import { errorResponse, successResponse, ErrorCodes } from '@/lib/api/response'
import { unstable_cache } from 'next/cache'

function getPath(request: NextRequest): string {
  return request.nextUrl.pathname
}

const getCachedDashboard = unstable_cache(
  async (staffId: string) => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const yesterday = new Date(start)
    yesterday.setDate(yesterday.getDate() - 1)

    const [
      paidOrders,
      yesterdayOrders,
      openTabs,
      openTabValue,
      tables,
      lowStock,
      recentOrders,
      paymentMix,
      hourlyRevenue,
      lastPayment,
    ] = await Promise.all([
      // Revenue counts orders that have been PAID. An OPEN order is work in
      // progress, not money: a customer can order six plates and walk out, and
      // that must not appear as revenue.
      prisma.order.aggregate({
        where: { createdAt: { gte: start }, status: 'PAID' },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: yesterday, lt: start }, status: 'PAID' },
        _sum: { total: true },
        _count: true,
      }),
      // Orders opened today and still running, shown separately from revenue so
      // the manager can see the value on the floor right now.
      prisma.order.count({ where: { createdAt: { gte: start }, status: 'OPEN' } }),
      prisma.order.aggregate({
        where: { createdAt: { gte: start }, status: 'OPEN' },
        _sum: { total: true },
      }),
      prisma.venueTable.findMany({
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          status: true,
          capacity: true,
          orders: {
            where: { status: 'OPEN' },
            orderBy: { createdAt: 'asc' },
            take: 1,
            select: {
              id: true,
              number: true,
              total: true,
              createdAt: true,
              payments: { select: { method: true, status: true } },
            },
          },
        },
      }),
      prisma.product.findMany({
        where: { status: 'ACTIVE', stock: { lte: prisma.product.fields.reorderAt } },
        select: { id: true, name: true, stock: true, reorderAt: true },
        orderBy: { stock: 'asc' },
        take: 10,
      }),
      prisma.order.findMany({
        where: { createdById: staffId },
        include: {
          items: { include: { product: { select: { name: true } } } },
          payments: { select: { method: true, status: true } },
          table: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.payment.groupBy({
        by: ['method'],
        where: { createdAt: { gte: start }, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.$queryRaw`
        SELECT 
          EXTRACT(HOUR FROM "createdAt")::int as hour,
          COALESCE(SUM("total")::text, '0') as revenue
        FROM "Order"
        WHERE "createdAt" >= ${start} AND status = 'PAID'
        GROUP BY EXTRACT(HOUR FROM "createdAt")
        ORDER BY hour
      ` as unknown as { hour: number; revenue: string }[],
      prisma.payment.findFirst({
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        select: { amount: true, method: true, createdAt: true },
      }),
    ])

    const [outstanding, revenueByCategory] = await Promise.all([
      /**
       * Outstanding is what customers still owe, so it has to net off payments
       * that have already been taken.
       *
       * The previous version summed the full total of every OPEN order, which
       * double-counted part-paid tabs: a 10,000 order with 6,000 already paid
       * in cash showed as 10,000 outstanding instead of 4,000. At closing that
       * is the difference between what is owed and what is in the drawer.
       */
      prisma.$queryRaw<{ outstanding: string | null }[]>`
        SELECT COALESCE(SUM(greatest(o.total - COALESCE(paid.paid, 0), 0))::text, '0') as outstanding
        FROM "Order" o
        LEFT JOIN (
          SELECT "orderId", SUM(amount) as paid
          FROM "Payment"
          WHERE status = 'COMPLETED'
          GROUP BY "orderId"
        ) paid ON paid."orderId" = o.id
        WHERE o.status = 'OPEN'
      `,
      /**
       * Category split for paid orders, matched to how the till groups them.
       *
       * "Bar" is a bucket rather than a seeded category — the schema has Beer,
       * Wine, Spirits, Cocktails and Soft Drinks — so it is summed explicitly
       * rather than left to a subtraction that would silently absorb anything
       * unrecognised.
       */
      prisma.$queryRaw<{ category: string; amount: string }[]>`
        SELECT
          CASE
            WHEN lower(c.name) = 'food' THEN 'Food'
            WHEN lower(c.name) = 'pool' THEN 'Pool'
            ELSE 'Bar'
          END as category,
          COALESCE(SUM(oi.subtotal)::text, '0') as amount
        FROM "OrderItem" oi
        JOIN "Product" p ON oi."productId" = p.id
        JOIN "Category" c ON p."categoryId" = c.id
        JOIN "Order" o ON oi."orderId" = o.id
        WHERE o."createdAt" >= ${start} AND o.status = 'PAID'
        GROUP BY 1
        ORDER BY amount DESC
      `,
    ])

    const outstandingValue = outstanding[0]?.outstanding ?? '0'

    return {
      revenue: paidOrders._sum.total?.toString() ?? '0',
      orderCount: paidOrders._count,
      yesterdayRevenue: yesterdayOrders._sum.total?.toString() ?? '0',
      yesterdayOrderCount: yesterdayOrders._count,
      // Every open tab right now, across the whole club, not just today's.
      activeTabs: openTabs,
      // Today's open work, so the manager can see the value on the floor as
      // well as the money already banked.
      openTabValue: openTabValue._sum.total?.toString() ?? '0',
      outstanding: outstandingValue,
      paymentMix: paymentMix.map((payment) => ({
        method: payment.method,
        amount: payment._sum.amount?.toString() ?? '0',
      })),
      tables: tables.map((table) => ({
        id: table.id,
        name: table.name,
        status: table.status,
        capacity: table.capacity,
        orders: table.orders.map((order) => ({
          id: order.id,
          number: order.number,
          total: order.total.toString(),
          createdAt: order.createdAt.toISOString(),
          payments: order.payments,
        })),
      })),
      lowStock: lowStock.map((product) => ({
        id: product.id,
        name: product.name,
        stock: product.stock.toString(),
        reorderAt: product.reorderAt.toString(),
      })),
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        number: order.number,
        total: order.total.toString(),
        status: order.status,
        table: order.table ? { name: order.table.name } : null,
        payments: order.payments,
        createdAt: order.createdAt.toISOString(),
      })),
      revenueByCategory: revenueByCategory.map((r) => ({
        category: r.category,
        amount: r.amount,
      })),
      hourlyRevenue,
      lastPayment: lastPayment
        ? {
            amount: lastPayment.amount.toString(),
            method: lastPayment.method,
            createdAt: lastPayment.createdAt.toISOString(),
          }
        : null,
    }
  },
  ['dashboard'],
  { revalidate: 10, tags: ['dashboard'] }
)

export async function GET(request: NextRequest) {
  try {
    const staff = await requireRole(Object.values(Role))
    const payload = await getCachedDashboard(staff.id)
    return successResponse({
      staff: {
        name: staff.name,
        role: staff.role,
        email: staff.email,
        roles: staff.roles,
      },
      ...payload,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to view dashboard', 403, undefined, getPath(request))
    }
    console.error('GET /api/dashboard error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Unable to load dashboard', 500, undefined, getPath(request))
  }
}