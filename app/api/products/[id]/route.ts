import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role, ProductStatus } from '@prisma/client'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  categoryId: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  costPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  stock: z.string().regex(/^\d+(\.\d{1,3})?$/).optional(),
  reorderAt: z.string().regex(/^\d+(\.\d{1,3})?$/).optional(),
  status: z.nativeEnum(ProductStatus).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER, Role.INVENTORY_MANAGER])
    const { id } = await params
    const body = await request.json()
    const data = updateSchema.parse(body)

    if (data.sku) {
      const existing = await prisma.product.findFirst({
        where: { sku: data.sku, NOT: { id } },
      })
      if (existing) {
        return NextResponse.json({ error: 'SKU already exists' }, { status: 400 })
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: { select: { name: true } } },
    })

    await prisma.auditLog.create({
      data: {
        userId: staff.id,
        action: 'UPDATE_PRODUCT',
        entity: 'Product',
        entityId: id,
        metadata: data,
      },
    })

    return NextResponse.json({
      ...product,
      price: product.price.toString(),
      costPrice: product.costPrice.toString(),
      stock: product.stock.toString(),
      reorderAt: product.reorderAt.toString(),
      category: { name: product.category.name },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: 'Unable to update product' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER])
    const { id } = await params

    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const orderItems = await prisma.orderItem.findFirst({ where: { productId: id } })
    if (orderItems) {
      await prisma.product.update({
        where: { id },
        data: { status: ProductStatus.INACTIVE },
      })
      return NextResponse.json({ success: true, archived: true })
    }

    await prisma.product.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        userId: staff.id,
        action: 'DELETE_PRODUCT',
        entity: 'Product',
        entityId: id,
        metadata: { name: product.name },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unable to delete product' }, { status: 500 })
  }
}