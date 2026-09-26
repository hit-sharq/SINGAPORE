import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { errorResponse, successResponse, ErrorCodes } from '@/lib/api/response'

function getPath(request: NextRequest): string {
  return request.nextUrl.pathname
}

export async function GET(request: NextRequest) {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER, Role.INVENTORY_MANAGER])
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const start = new Date()
    start.setDate(start.getDate() - days)
    start.setHours(0, 0, 0, 0)

    const [
      products,
      salesData,
      stockMovements,
    ] = await Promise.all([
      prisma.product.findMany({
        where: { status: 'ACTIVE' },
        include: { category: true },
        orderBy: { name: 'asc' },
      }),
      prisma.$queryRaw`
        SELECT p.id, p.name, p.category, 
          COALESCE(SUM(oi.quantity)::int, 0) as sold,
          COALESCE(SUM(oi."totalPrice")::text, '0') as revenue,
          COALESCE(AVG(oi."unitPrice")::text, '0') as avgPrice
        FROM "Product" p
        LEFT JOIN "OrderItem" oi ON p.id = oi."productId"
        LEFT JOIN "Order" o ON oi."orderId" = o.id AND o.status = 'PAID' AND o."createdAt" >= ${start}
        GROUP BY p.id, p.name, p.category
        ORDER BY sold DESC
      ` as unknown as { id: string; name: string; category: string | null; sold: number; revenue: string; avgPrice: string }[],
      prisma.stockMovement.findMany({
        where: { createdAt: { gte: start } },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { product: { select: { name: true } } },
      }),
    ])

    const salesMap = new Map(salesData.map((s) => [s.id, s]))

    return successResponse({
      periodDays: days,
      products: products.map((p) => {
        const sales = salesMap.get(p.id)
        const cost = Number(p.costPrice)
        const price = Number(p.price)
        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category?.name ?? null,
          stock: p.stock.toString(),
          reorderAt: p.reorderAt.toString(),
          cost: p.costPrice.toString(),
          price: p.price.toString(),
          margin: cost > 0 ? (((price - cost) / price) * 100).toFixed(1) : '0',
          sold: sales?.sold ?? 0,
          revenue: sales?.revenue ?? '0',
          avgPrice: sales?.avgPrice ?? '0',
        }
      }),
      stockMovements: stockMovements.map((m) => ({
        id: m.id,
        product: m.product.name,
        type: Number(m.quantity) > 0 ? 'IN' : 'OUT',
        quantity: m.quantity.toString(),
        reason: m.reason,
        createdAt: m.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to view product report', 403, undefined, getPath(request))
    }
    console.error('GET /api/reports/products error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Unable to load product report', 500, undefined, getPath(request))
  }
}