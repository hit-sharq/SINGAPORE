import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function GET(request: Request) {
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
      prisma.inventoryMovement.findMany({
        where: { createdAt: { gte: start } },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { product: { select: { name: true } } },
      }),
    ])

    const salesMap = new Map(salesData.map((s) => [s.id, s]))

    return NextResponse.json({
      periodDays: days,
      products: products.map((p) => {
        const sales = salesMap.get(p.id)
        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category?.name ?? null,
          stock: p.stock.toString(),
          reorderAt: p.reorderAt.toString(),
          cost: p.cost.toString(),
          price: p.price.toString(),
          margin: p.cost > 0 ? (((p.price - p.cost) / p.price) * 100).toFixed(1) : '0',
          sold: sales?.sold ?? 0,
          revenue: sales?.revenue ?? '0',
          avgPrice: sales?.avgPrice ?? '0',
        }
      }),
      stockMovements: stockMovements.map((m) => ({
        id: m.id,
        product: m.product.name,
        type: m.type,
        quantity: m.quantity.toString(),
        reason: m.reason,
        createdAt: m.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unable to load product report' }, { status: 500 })
  }
}