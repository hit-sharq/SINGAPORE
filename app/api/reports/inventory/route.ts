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
      stockMovements,
      lowStock,
      reorderNeeded,
    ] = await Promise.all([
      prisma.product.findMany({
        where: { status: 'ACTIVE' },
        include: { category: true },
        orderBy: { name: 'asc' },
      }),
      prisma.stockMovement.findMany({
        where: { createdAt: { gte: start } },
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { name: true, category: true } } },
      }),
      prisma.product.findMany({
        where: { status: 'ACTIVE', stock: { lte: prisma.product.fields.reorderAt } },
        select: { id: true, name: true, stock: true, reorderAt: true, category: { select: { name: true } } },
        orderBy: { stock: 'asc' },
      }),
      prisma.product.findMany({
        where: { status: 'ACTIVE', stock: { lte: 0 } },
        select: { id: true, name: true, stock: true, category: { select: { name: true } } },
        orderBy: { stock: 'asc' },
      }),
    ])

    const inCount = stockMovements.filter((m) => Number(m.quantity) > 0).length
    const outCount = stockMovements.filter((m) => Number(m.quantity) < 0).length
    const inQty = stockMovements.filter((m) => Number(m.quantity) > 0).reduce((sum, m) => sum + Number(m.quantity), 0)
    const outQty = stockMovements.filter((m) => Number(m.quantity) < 0).reduce((sum, m) => sum + Math.abs(Number(m.quantity)), 0)

    return NextResponse.json({
      periodDays: days,
      summary: {
        totalProducts: products.length,
        totalStockValue: products.reduce((sum, p) => sum + (Number(p.stock) * Number(p.costPrice)), 0).toFixed(2),
        inMovements: inCount,
        outMovements: outCount,
        inQuantity: inQty.toFixed(3),
        outQuantity: outQty.toFixed(3),
        lowStockCount: lowStock.length,
        outOfStockCount: reorderNeeded.length,
      },
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category?.name || null,
        stock: p.stock.toString(),
        reorderAt: p.reorderAt.toString(),
        cost: p.costPrice.toString(),
        price: p.price.toString(),
        stockValue: (Number(p.stock) * Number(p.costPrice)).toFixed(2),
        status: Number(p.stock) <= 0 ? 'OUT' : Number(p.stock) <= Number(p.reorderAt) ? 'LOW' : 'OK',
      })),
      stockMovements: stockMovements.slice(0, 100).map((m) => ({
        id: m.id,
        product: m.product.name,
        category: m.product.category,
        type: Number(m.quantity) > 0 ? 'IN' : 'OUT',
        quantity: Math.abs(Number(m.quantity)).toFixed(3),
        reason: m.reason,
        createdAt: m.createdAt.toISOString(),
      })),
      lowStock: lowStock.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category?.name || null,
        stock: p.stock.toString(),
        reorderAt: p.reorderAt.toString(),
      })),
      outOfStock: reorderNeeded.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category?.name || null,
        stock: p.stock.toString(),
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unable to load inventory report' }, { status: 500 })
  }
}