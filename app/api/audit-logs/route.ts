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
    await requireRole([Role.ADMIN, Role.MANAGER])
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const action = searchParams.get('action') || ''
    const entity = searchParams.get('entity') || ''
    const userId = searchParams.get('userId') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = {}
    if (action) where.action = { contains: action, mode: 'insensitive' }
    if (entity) where.entity = { contains: entity, mode: 'insensitive' }
    if (userId) where.userId = userId
    if (startDate || endDate) {
      const createdAtFilter: Record<string, Date> = {}
      if (startDate) createdAtFilter.gte = new Date(startDate)
      if (endDate) createdAtFilter.lte = new Date(endDate)
      where.createdAt = createdAtFilter
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    const actions = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
      take: 20,
    })

    const entities = await prisma.auditLog.groupBy({
      by: ['entity'],
      _count: { entity: true },
      orderBy: { _count: { entity: 'desc' } },
      take: 20,
    })

    return successResponse({
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        metadata: l.metadata,
        user: l.user,
        createdAt: l.createdAt.toISOString(),
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      filters: { actions: actions.map((a) => a.action), entities: entities.map((e) => e.entity) },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to view audit logs', 403, undefined, getPath(request))
    }
    console.error('GET /api/audit-logs error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Unable to load audit logs', 500, undefined, getPath(request))
  }
}