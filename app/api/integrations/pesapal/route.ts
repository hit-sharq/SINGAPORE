import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'
import { errorResponse, successResponse, ErrorCodes } from '@/lib/api/response'

const pesapalSchema = z.object({
  consumerKey: z.string().min(1, 'Consumer key is required'),
  consumerSecret: z.string().min(1, 'Consumer secret is required'),
  ipnUrl: z.string().url('Invalid URL format').optional().or(z.string().optional()),
  enabled: z.boolean().default(false),
})

function getPath(request: NextRequest): string {
  return request.nextUrl.pathname
}

export async function GET(request: NextRequest) {
  try {
    await requireRole([Role.ADMIN])

    const [key, secret, ipnUrl, enabled] = await Promise.all([
      prisma.appSetting.findUnique({ where: { key: 'pesapal_consumer_key' } }),
      prisma.appSetting.findUnique({ where: { key: 'pesapal_consumer_secret' } }),
      prisma.appSetting.findUnique({ where: { key: 'pesapal_ipn_url' } }),
      prisma.appSetting.findUnique({ where: { key: 'pesapal_enabled' } }),
    ])

    return successResponse({
      config: {
        consumerKey: process.env.PESAPAL_CONSUMER_KEY || key?.value || '',
        consumerSecret: process.env.PESAPAL_CONSUMER_SECRET || secret?.value || '',
        ipnUrl: ipnUrl?.value || '',
        enabled: enabled?.value === 'true',
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Only administrators can view Pesapal config', 403, undefined, getPath(request))
    }
    console.error('GET /api/integrations/pesapal error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Unable to load Pesapal config', 500, undefined, getPath(request))
  }
}

export async function POST(request: NextRequest) {
  try {
    const staff = await requireRole([Role.ADMIN])
    const body = await request.json()
    const parsed = pesapalSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid Pesapal config', 400, parsed.error.issues, getPath(request))
    }

    const { consumerKey, consumerSecret, ipnUrl, enabled } = parsed.data

    await prisma.appSetting.upsert({
      where: { key: 'pesapal_consumer_key' },
      update: { value: consumerKey },
      create: { key: 'pesapal_consumer_key', value: consumerKey },
    })
    await prisma.appSetting.upsert({
      where: { key: 'pesapal_consumer_secret' },
      update: { value: consumerSecret },
      create: { key: 'pesapal_consumer_secret', value: consumerSecret },
    })
    if (ipnUrl) {
      await prisma.appSetting.upsert({
        where: { key: 'pesapal_ipn_url' },
        update: { value: ipnUrl },
        create: { key: 'pesapal_ipn_url', value: ipnUrl },
      })
    }
    await prisma.appSetting.upsert({
      where: { key: 'pesapal_enabled' },
      update: { value: enabled ? 'true' : 'false' },
      create: { key: 'pesapal_enabled', value: enabled ? 'true' : 'false' },
    })

    await prisma.auditLog.create({
      data: {
        userId: staff.id,
        action: 'UPDATE_PESAPAL_CONFIG',
        entity: 'AppSetting',
        metadata: { enabled },
      },
    })

    return successResponse({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Only administrators can update Pesapal config', 403, undefined, getPath(request))
    }
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid Pesapal config', 400, error.issues, getPath(request))
    }
    console.error('POST /api/integrations/pesapal error:', error)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to save Pesapal config', 500, undefined, getPath(request))
  }
}