import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'
import { errorResponse, successResponse, createdResponse, ErrorCodes } from '@/lib/api/response'

const exportSchema = z.object({
  entity: z.enum(['orders', 'products', 'customers', 'staff', 'shifts', 'payments', 'stockMovements', 'auditLogs']),
  format: z.enum(['json', 'csv']).default('json'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
})

function getPath(request: NextRequest): string {
  return request.nextUrl.pathname
}

function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, newKey))
    } else {
      result[newKey] = value
    }
  }
  return result
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((o: unknown, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj)
}

export async function GET(request: NextRequest) {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER])
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const [exports, total] = await Promise.all([
      prisma.dataArchive.findMany({
        orderBy: { archivedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.dataArchive.count(),
    ])

    return successResponse({
      exports: exports.map((e) => ({
        id: e.id,
        entity: e.entity,
        entityId: e.entityId,
        payload: e.payload,
        archivedAt: e.archivedAt.toISOString(),
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to view exports', 403, undefined, getPath(request))
    }
    console.error('GET /api/data-export error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Unable to load exports', 500, undefined, getPath(request))
  }
}

export async function POST(request: NextRequest) {
  try {
    const staff = await requireRole([Role.ADMIN, Role.MANAGER])
    const body = await request.json()
    const parsed = exportSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid export data', 400, parsed.error.issues, getPath(request))
    }

    const { entity, format, dateFrom, dateTo, filters } = parsed.data

    let data: any[] = []
    let where: Record<string, unknown> = {}

    if (dateFrom || dateTo) {
      const createdAtFilter: Record<string, Date> = {}
      if (dateFrom) createdAtFilter.gte = new Date(dateFrom)
      if (dateTo) createdAtFilter.lte = new Date(dateTo)
      where.createdAt = createdAtFilter
    }

    if (filters) Object.assign(where, filters)

    switch (entity) {
      case 'orders':
        data = await prisma.order.findMany({
          where,
          include: { items: { include: { product: true } }, payments: true, table: true, createdBy: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        })
        break
      case 'products':
        data = await prisma.product.findMany({
          where,
          include: { category: true },
          orderBy: { name: 'asc' },
        })
        break
      case 'customers':
        {
          const include: any = {
            orders: { include: { order: { include: { payments: true, items: true } } } },
          }
          data = await prisma.customer.findMany({
            where,
            // @ts-ignore - Prisma relations not in schema
            include,
            orderBy: { createdAt: 'desc' },
          }) as any
        }
        break
      case 'staff':
        data = await prisma.staffProfile.findMany({
          where,
          include: { grants: true, shifts: true },
          orderBy: { name: 'asc' },
        })
        break
      case 'shifts':
        data = await prisma.shift.findMany({
          where,
          include: { cashTransactions: true, user: { select: { name: true } } },
          orderBy: { startsAt: 'desc' },
        })
        break
      case 'payments':
        data = await prisma.payment.findMany({
          where,
          include: { order: { select: { number: true, tableId: true } } },
          orderBy: { createdAt: 'desc' },
        })
        break
      case 'stockMovements':
        data = await prisma.stockMovement.findMany({
          where,
          include: { product: { select: { name: true, sku: true, category: { select: { name: true } } } } },
          orderBy: { createdAt: 'desc' },
        })
        break
      case 'auditLogs':
        data = await prisma.auditLog.findMany({
          where,
          include: { user: { select: { name: true, email: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        })
        break
    }

    const archive = await prisma.dataArchive.create({
      data: {
        entity,
        entityId: `export_${Date.now()}`,
        payload: { data: JSON.parse(JSON.stringify(data)), format, filters: { dateFrom, dateTo, ...filters }, exportedBy: staff.id, exportedAt: new Date().toISOString() } as any,
      },
    })

    await prisma.auditLog.create({
      data: { userId: staff.id, action: 'EXPORT_DATA', entity: 'DataArchive', entityId: archive.id, metadata: { entity, format, count: data.length } },
    })

    if (format === 'csv') {
      const headers = data.length > 0 ? Object.keys(flattenObject(data[0])) : []
      const rows = data.map((row) => headers.map((h) => JSON.stringify(getNestedValue(row, h))).join(','))
      const csv = [headers.join(','), ...rows].join('\n')
      return new NextResponse(csv, {
        headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="${entity}_${Date.now()}.csv"` },
      })
    }

    return createdResponse({ archiveId: archive.id, count: data.length, data })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to export data', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid export data', 400, error.issues, getPath(request))
    }
    console.error('POST /api/data-export error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to export data', 500, undefined, getPath(request))
  }
}