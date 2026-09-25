import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function GET(request: Request) {
  try {
    await requireRole([Role.ADMIN, Role.MANAGER])
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '90')
    const start = new Date()
    start.setDate(start.getDate() - days)
    start.setHours(0, 0, 0, 0)

    const [
      customers,
      customerOrders,
      visitFrequency,
      topCustomers,
    ] = await Promise.all([
      prisma.customer.findMany({
        include: {
          _count: { select: { orders: true } },
          orders: {
            include: { order: { include: { payments: true, items: { include: { product: true } } } } },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.$queryRaw`
        SELECT c.id, c.name, c.phone, c.email,
          COALESCE(COUNT(co.id)::int, 0) as visitCount,
          COALESCE(SUM(o.total)::text, '0') as totalSpent,
          MAX(o."createdAt") as lastVisit,
          MIN(o."createdAt") as firstVisit
        FROM "Customer" c
        LEFT JOIN "CustomerOrder" co ON c.id = co."customerId"
        LEFT JOIN "Order" o ON co."orderId" = o.id AND o.status = 'PAID' AND o."createdAt" >= ${start}
        GROUP BY c.id, c.name, c.phone, c.email
        HAVING COUNT(co.id) > 0
        ORDER BY totalSpent DESC
      ` as unknown as { id: string; name: string; phone: string | null; email: string | null; visitCount: number; totalSpent: string; lastVisit: string | null; firstVisit: string | null }[],
      prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN visit_count = 1 THEN '1 visit'
            WHEN visit_count BETWEEN 2 AND 3 THEN '2-3 visits'
            WHEN visit_count BETWEEN 4 AND 10 THEN '4-10 visits'
            ELSE '10+ visits'
          END as frequency,
          COUNT(*)::int as customers
        FROM (
          SELECT c.id, COUNT(co.id) as visit_count
          FROM "Customer" c
          LEFT JOIN "CustomerOrder" co ON c.id = co."customerId"
          LEFT JOIN "Order" o ON co."orderId" = o.id AND o.status = 'PAID' AND o."createdAt" >= ${start}
          GROUP BY c.id
        ) sub
        GROUP BY frequency
        ORDER BY 
          CASE frequency
            WHEN '1 visit' THEN 1
            WHEN '2-3 visits' THEN 2
            WHEN '4-10 visits' THEN 3
            ELSE 4
          END
      ` as unknown as { frequency: string; customers: number }[],
      prisma.$queryRaw`
        SELECT c.id, c.name, c.phone, c.email,
          COALESCE(COUNT(co.id)::int, 0) as visitCount,
          COALESCE(SUM(o.total)::text, '0') as totalSpent,
          MAX(o."createdAt") as lastVisit
        FROM "Customer" c
        LEFT JOIN "CustomerOrder" co ON c.id = co."customerId"
        LEFT JOIN "Order" o ON co."orderId" = o.id AND o.status = 'PAID' AND o."createdAt" >= ${start}
        GROUP BY c.id, c.name, c.phone, c.email
        HAVING COUNT(co.id) > 0
        ORDER BY totalSpent DESC
        LIMIT 10
      ` as unknown as { id: string; name: string; phone: string | null; email: string | null; visitCount: number; totalSpent: string; lastVisit: string | null }[],
    ])

    const totalCustomers = customers.length
    const activeCustomers = customerOrders.length
    const newCustomers = customers.filter((c) => new Date(c.createdAt) >= start).length
    const avgSpend = activeCustomers > 0
      ? (customerOrders.reduce((sum, c) => sum + parseFloat(c.totalSpent), 0) / activeCustomers).toFixed(2)
      : '0'
    const avgVisits = activeCustomers > 0
      ? (customerOrders.reduce((sum, c) => sum + c.visitCount, 0) / activeCustomers).toFixed(1)
      : '0'

    return NextResponse.json({
      periodDays: days,
      summary: {
        totalCustomers,
        activeCustomers,
        newCustomers,
        avgSpend,
        avgVisits,
      },
      visitFrequency: visitFrequency.map((v) => ({ frequency: v.frequency, customers: v.customers })),
      topCustomers: topCustomers.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        visitCount: c.visitCount,
        totalSpent: c.totalSpent,
        lastVisit: c.lastVisit,
      })),
      allCustomers: customerOrders.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        visitCount: c.visitCount,
        totalSpent: c.totalSpent,
        lastVisit: c.lastVisit,
        firstVisit: c.firstVisit,
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Unable to load customer insights' }, { status: 500 })
  }
}