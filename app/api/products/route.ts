import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role, ProductStatus } from '@prisma/client'

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  categoryId: z.string(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  costPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
  stock: z.string().regex(/^\d+(\.\d{1,3})?$/).default('0'),
  reorderAt: z.string().regex(/^\d+(\.\d{1,3})?$/).default('0'),
  status: z.nativeEnum(ProductStatus).default('ACTIVE'),
})

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

export async function GET() {
  try {
    const staff = await requireRole(Object.values(Role))
    const products = await prisma.product.findMany({
      include: { category: { select: { name: true } } },
      orderBy: { category: { name: 'asc' } },
    })

    return NextResponse.json(
      products.map((product) => ({
        ...product,
        price: product.price.toString(),
        costPrice: product.costPrice.toString(),
        stock: product.stock.toString(),
        reorderAt: product.reorderAt.toString(),
        category: { name: product.category.name },
      }))
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unable to load products' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER, Role.INVENTORY_MANAGER])
    const body = await request.json()
    const data = productSchema.parse(body)

    const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } })
    if (existingSku) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        categoryId: data.categoryId,
        price: data.price,
        costPrice: data.costPrice,
        stock: data.stock,
        reorderAt: data.reorderAt,
        status: data.status,
      },
      include: { category: { select: { name: true } } },
    })

    await prisma.auditLog.create({
      data: {
        userId: staff.id,
        action: 'CREATE_PRODUCT',
        entity: 'Product',
        entityId: product.id,
        metadata: { name: product.name, sku: product.sku },
      },
    })

    return NextResponse.json({
      ...product,
      price: product.price.toString(),
      costPrice: product.costPrice.toString(),
      stock: product.stock.toString(),
      reorderAt: product.reorderAt.toString(),
      category: { name: product.category.name },
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: 'Unable to create product' }, { status: 500 })
  }
}