import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role, OrderStatus, PaymentStatus } from '@prisma/client'
import { errorResponse, successResponse, ErrorCodes } from '@/lib/api/response'

function getPath(request: NextRequest): string {
  return request.nextUrl.pathname
}

export async function GET(request: NextRequest) {
  try {
    const staff = await requireRole(Object.values(Role))
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const yesterday = new Date(start)
    yesterday.setDate(yesterday.getDate() - 1)

    const [
      todayOrders,
      yesterdayOrders,
      activeTabs,
      tables,
      lowStock,
      recentOrders,
      paymentMix,
      hourlyRevenue,
      lastPayment,
    ] = await Promise.all([
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
      prisma.order.count({ where: { status: 'OPEN' } }),
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
        where: { createdById: staff.id },
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
      prisma.order.aggregate({
        where: { status: 'OPEN' },
        _sum: { total: true },
      }),
      prisma.$queryRaw`
        SELECT c.name as category, COALESCE(SUM(oi.subtotal)::text, '0') as amount
        FROM "OrderItem" oi
        JOIN "Product" p ON oi."productId" = p.id
        JOIN "Category" c ON p."categoryId" = c.id
        JOIN "Order" o ON oi."orderId" = o.id
        WHERE o."createdAt" >= ${start} AND o.status = 'PAID'
        GROUP BY c.name
        ORDER BY amount DESC
      ` as unknown as { category: string; amount: string }[],
    ])

    return successResponse({
      staff: {
        name: staff.name,
        role: staff.role,
        email: staff.email,
        roles: staff.roles,
      },
      revenue: todayOrders._sum.total?.toString() ?? '0',
      orderCount: todayOrders._count,
      yesterdayRevenue: yesterdayOrders._sum.total?.toString() ?? '0',
      yesterdayOrderCount: yesterdayOrders._count,
      activeTabs,
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
      outstanding: outstanding._sum.total?.toString() ?? '0',
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
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to view dashboard', 403, undefined, getPath(request))
    }
    console.error('GET /api/dashboard error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Unable to load dashboard', 500, undefined, getPath(request))
  }
}