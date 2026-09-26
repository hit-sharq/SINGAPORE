import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role, ProductStatus } from '@prisma/client'
import { errorResponse, createdResponse, successResponse, ErrorCodes } from '@/lib/api/response'

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  categoryId: z.string().min(1, 'Category is required'),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format'),
  costPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid cost price format'),
  stock: z.string().regex(/^\d+(\.\d{1,3})?$/, 'Invalid stock format').default('0'),
  reorderAt: z.string().regex(/^\d+(\.\d{1,3})?$/, 'Invalid reorder point format').default('0'),
  status: z.nativeEnum(ProductStatus).default('ACTIVE'),
})

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

export async function GET(request: NextRequest) {
  try {
    await requireRole(Object.values(Role))
    const products = await prisma.product.findMany({
      include: { category: { select: { name: true } } },
      orderBy: { category: { name: 'asc' } },
    })

    return successResponse({
      products: products.map(formatProduct),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to view products', 403, undefined, getPath(request))
    }
    console.error('GET /api/products error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Unable to load products', 500, undefined, getPath(request))
  }
}

export async function POST(request: NextRequest) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER, Role.INVENTORY_MANAGER])
    const body = await request.json()
    const parsed = productSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid product data', 400, parsed.error.issues, getPath(request))
    }

    const data = parsed.data

    const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } })
    if (existingSku) {
      return errorResponse(ErrorCodes.CONFLICT, 'A product with this SKU already exists', 400, { field: 'sku' }, getPath(request))
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

    return createdResponse({ product: formatProduct(product) })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to create products', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid product data', 400, error.issues, getPath(request))
    }
    console.error('POST /api/products error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to create product', 500, undefined, getPath(request))
  }
}