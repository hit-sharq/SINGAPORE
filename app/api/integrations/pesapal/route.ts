import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'

const pesapalSchema = z.object({
  consumerKey: z.string().min(1),
  consumerSecret: z.string().min(1),
  ipnUrl: z.string().url().optional().or(z.string().optional()),
  enabled: z.boolean().default(false),
})

export async function GET() {
  try {
    await requireRole([Role.ADMIN])

    const [key, secret, ipnUrl, enabled] = await Promise.all([
      prisma.appSetting.findUnique({ where: { key: 'pesapal_consumer_key' } }),
      prisma.appSetting.findUnique({ where: { key: 'pesapal_consumer_secret' } }),
      prisma.appSetting.findUnique({ where: { key: 'pesapal_ipn_url' } }),
      prisma.appSetting.findUnique({ where: { key: 'pesapal_enabled' } }),
    ])

    return NextResponse.json({
      config: {
        consumerKey: key?.value ?? '',
        consumerSecret: secret?.value ?? '',
        ipnUrl: ipnUrl?.value ?? '',
        enabled: enabled?.value === 'true',
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unable to load Pesapal config' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const staff = await requireRole([Role.ADMIN])
    const body = await request.json()
    const { consumerKey, consumerSecret, ipnUrl, enabled } = pesapalSchema.parse(body)

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

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.issues }, { status: 400 })
    return NextResponse.json({ error: 'Failed to save Pesapal config' }, { status: 500 })
  }
}
