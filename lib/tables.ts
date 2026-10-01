import { OrderStatus, Prisma } from '@prisma/client'

/**
 * Table status transitions.
 *
 * A table is OCCUPIED while any order against it is still running, and only
 * becomes AVAILABLE once the last one is settled. Keeping this in one place
 * matters because the release rule has to consider *other* open orders —
 * otherwise voiding one tab frees a table that a second tab is still using,
 * and the next party sits down on top of a live bill.
 */

/**
 * Order states that still hold a table. Only OPEN does: a PAID order has been
 * settled, and a VOID or REFUNDED one is finished with.
 */
const ACTIVE_ORDER_STATUSES: OrderStatus[] = [OrderStatus.OPEN]

/** Mark a table occupied. Called when an order is opened against it. */
export async function markTableOccupied(
  tx: Prisma.TransactionClient,
  tableId: string,
) {
  await tx.venueTable.update({
    where: { id: tableId },
    data: { status: 'OCCUPIED' },
  })
}

/**
 * Release a table only when no active order remains against it.
 *
 * Safe to call after any order reaches a settled state: if another tab is
 * still open on the same table, the table stays OCCUPIED.
 */
export async function releaseTableIfFree(
  tx: Prisma.TransactionClient,
  tableId: string,
) {
  const remaining = await tx.order.count({
    where: {
      tableId,
      status: { in: ACTIVE_ORDER_STATUSES },
    },
  })

  // A table with a live tab on it must not be handed to the next party.
  if (remaining > 0) return

  await tx.venueTable.update({
    where: { id: tableId },
    data: { status: 'AVAILABLE' },
  })
}
