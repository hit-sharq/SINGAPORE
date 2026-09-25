import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function GET(request: Request) {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER])
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const start = new Date()
    start.setDate(start.getDate() - days)
    start.setHours(0, 0, 0, 0)

    const [
      staff,
      staffSales,
      staffHours,
    ] = await Promise.all([
      prisma.staffProfile.findMany({
        where: { active: true },
        select: { id: true, name: true, role: true },
      }),
      prisma.$queryRaw`
        SELECT sp.id, sp.name, sp.role,
          COALESCE(SUM(o.total)::text, '0') as totalSales,
          COALESCE(COUNT(o.id)::int, 0) as orderCount,
          COALESCE(SUM(CASE WHEN p.method = 'CASH' THEN p.amount ELSE 0 END)::text, '0') as cashSales,
          COALESCE(SUM(CASE WHEN p.method = 'CARD' THEN p.amount ELSE 0 END)::text, '0') as cardSales,
          COALESCE(SUM(CASE WHEN p.method = 'PESAPAL' THEN p.amount ELSE 0 END)::text, '0') as pesapalSales
        FROM "StaffProfile" sp
        LEFT JOIN "Order" o ON sp.id = o."createdById" AND o.status = 'PAID' AND o."createdAt" >= ${start}
        LEFT JOIN "Payment" p ON o.id = p."orderId" AND p.status = 'COMPLETED'
        WHERE sp.active = true
        GROUP BY sp.id, sp.name, sp.role
        ORDER BY totalSales DESC
      ` as unknown as { id: string; name: string; role: string; totalSales: string; orderCount: number; cashSales: string; cardSales: string; pesapalSales: string }[],
      prisma.shift.findMany({
        where: { startsAt: { gte: start } },
        select: { userId: true, startsAt: true, endsAt: true },
      }),
    ])

    const hoursMap = new Map<string, number>()
    staffHours.forEach((s) => {
      if (s.endsAt) {
        const hrs = (new Date(s.endsAt).getTime() - new Date(s.startsAt).getTime()) / (1000 * 60 * 60)
        hoursMap.set(s.userId, (hoursMap.get(s.userId) || 0) + hrs)
      }
    })

    return NextResponse.json({
      periodDays: days,
      staff: staff.map((s) => {
        const sales = staffSales.find((ss) => ss.id === s.id)
        const hours = hoursMap.get(s.id) || 0
        return {
          id: s.id,
          name: s.name,
          role: s.role,
          totalSales: sales?.totalSales || '0',
          orderCount: sales?.orderCount || 0,
          cashSales: sales?.cashSales || '0',
          cardSales: sales?.cardSales || '0',
          pesapalSales: sales?.pesapalSales || '0',
          hours: hours.toFixed(1),
          avgOrderValue: sales?.orderCount ? (parseFloat(sales.totalSales) / sales.orderCount).toFixed(2) : '0',
        }
      }),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unable to load staff performance' }, { status: 500 })
  }
}