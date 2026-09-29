import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { errorResponse, successResponse, ErrorCodes } from '@/lib/api/response'
import { revalidateTag } from 'next/cache'

const adjustSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  quantity: z.string().regex(/^-?\d+(\.\d{1,3})?$/, 'Invalid quantity format'),
  reason: z.string().min(1, 'Reason is required'),
  reference: z.string().optional(),
})

function getPath(request: NextRequest): string {
  return request.nextUrl.pathname
}

function formatProduct(product: any) {
  return {
    ...product,
    price: product.price?.toString() ?? '0',
    costPrice: product.costPrice != null ? product.costPrice.toString() : null,
    stock: product.stock?.toString() ?? '0',
    reorderAt: product.reorderAt?.toString() ?? '0',
    category: { name: product.category?.name },
  }
}

export async function POST(request: NextRequest) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER, Role.INVENTORY_MANAGER])
    const body = await request.json()
    const parsed = adjustSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid adjustment data', 400, parsed.error.issues, getPath(request))
    }

    const { productId, quantity, reason, reference } = parsed.data

    const qty = Number(quantity)
    if (qty === 0) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Quantity cannot be zero', 400, { field: 'quantity' }, getPath(request))
    }

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Product not found', 404, undefined, getPath(request))
    }

    const newStock = Number(product.stock) + qty
    if (newStock < 0) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Insufficient stock for this adjustment', 400, { field: 'quantity' }, getPath(request))
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

    revalidateTag('dashboard', 'max')
    return successResponse({
      product: formatProduct(updated),
      movement,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to adjust stock', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid adjustment data', 400, error.issues, getPath(request))
    }
    console.error('POST /api/inventory/adjust error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to adjust stock', 500, undefined, getPath(request))
  }
}