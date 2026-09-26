import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role, ProductStatus } from '@prisma/client'
import { errorResponse, successResponse, ErrorCodes } from '@/lib/api/response'

const updateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  sku: z.string().min(1, 'SKU is required').optional(),
  categoryId: z.string().min(1, 'Category is required').optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format').optional(),
  costPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid cost price format').optional(),
  stock: z.string().regex(/^\d+(\.\d{1,3})?$/, 'Invalid stock format').optional(),
  reorderAt: z.string().regex(/^\d+(\.\d{1,3})?$/, 'Invalid reorder point format').optional(),
  status: z.nativeEnum(ProductStatus).optional(),
})

function getPath(request: NextRequest): string {
  return request.nextUrl.pathname
}

function formatProduct(product: any) {
  return {
    ...product,
    price: product.price.toString(),
    costPrice: product.costPrice.toString(),
    stock: product.stock.toString(),
    reorderAt: product.reorderAt.toString(),
    category: { name: product.category?.name },
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER, Role.INVENTORY_MANAGER])
    const { id } = await params
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid product data', 400, parsed.error.issues, getPath(request))
    }

    const data = parsed.data

    if (data.sku) {
      const existing = await prisma.product.findFirst({
        where: { sku: data.sku, NOT: { id } },
      })
      if (existing) {
        return errorResponse(ErrorCodes.CONFLICT, 'A product with this SKU already exists', 400, { field: 'sku' }, getPath(request))
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

    return successResponse({ product: formatProduct(product) })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to update products', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid product data', 400, error.issues, getPath(request))
    }
    console.error('PATCH /api/products/[id] error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to update product', 500, undefined, getPath(request))
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER])
    const { id } = await params

    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Product not found', 404, undefined, getPath(request))
    }

    const orderItems = await prisma.orderItem.findFirst({ where: { productId: id } })
    if (orderItems) {
      await prisma.product.update({
        where: { id },
        data: { status: ProductStatus.INACTIVE },
      })
      return successResponse({ success: true, archived: true })
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

    return successResponse({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to delete products', 403, undefined, getPath(request))
    }
    console.error('DELETE /api/products/[id] error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to delete product', 500, undefined, getPath(request))
  }
}