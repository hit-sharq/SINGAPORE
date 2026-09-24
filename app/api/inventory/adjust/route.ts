import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

const adjustSchema = z.object({
  productId: z.string(),
  quantity: z.string().regex(/^-?\d+(\.\d{1,3})?$/),
  reason: z.string().min(1),
  reference: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER, Role.INVENTORY_MANAGER])
    const body = await request.json()
    const { productId, quantity, reason, reference } = adjustSchema.parse(body)

    const qty = Number(quantity)
    if (qty === 0) {
      return NextResponse.json({ error: 'Quantity cannot be zero' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const newStock = Number(product.stock) + qty
    if (newStock < 0) {
      return NextResponse.json({ error: 'Insufficient stock for this adjustment' }, { status: 400 })
    }

    const [updated, movement] = await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { stock: { increment: qty } },
        include: { category: { select: { name: true } } },
      }),
      prisma.stockMovement.create({
        data: {
          productId,
          quantity: qty,
          reason,
          reference: reference || `ADJ_${Date.now()}`,
        },
      }),
    ])

    await prisma.auditLog.create({
      data: {
        userId: staff.id,
        action: 'ADJUST_STOCK',
        entity: 'Product',
        entityId: productId,
        metadata: { quantity: qty, reason, previousStock: product.stock.toString(), newStock: updated.stock.toString() },
      },
    })

    return NextResponse.json({
      product: {
        ...updated,
        price: updated.price.toString(),
        costPrice: updated.costPrice.toString(),
        stock: updated.stock.toString(),
        reorderAt: updated.reorderAt.toString(),
        category: { name: updated.category.name },
      },
      movement,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: 'Unable to adjust stock' }, { status: 500 })
  }
}