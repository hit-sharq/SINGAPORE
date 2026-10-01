/**
 * Every message a member of staff can see.
 *
 * The rule this file exists to enforce: staff see a short sentence about what
 * to do next, and the technical detail goes to the server log. A waiter should
 * never be shown a stack trace, a Prisma error, a provider's HTML error page,
 * or a message like "Unexpected token '<'".
 *
 * Each entry has:
 *   title    one line, shown as the headline
 *   message  what the person should do next
 *   hint     optional, only shown when there is a concrete next step
 */

export type StaffFacingCode =
  | 'AUTH_REQUIRED'
  | 'AUTH_EXPIRED'
  | 'FORBIDDEN'
  | 'PENDING_APPROVAL'
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'OFFLINE'
  | 'PRODUCT_UNAVAILABLE'
  | 'INSUFFICIENT_STOCK'
  | 'INVALID_PHONE'
  | 'PAYMENT_DECLINED'
  | 'PAYMENT_TIMEOUT'
  | 'PAYMENT_NOT_CONFIGURED'
  | 'PAYMENT_PROVIDER_ERROR'
  | 'SHIFT_ALREADY_OPEN'
  | 'NO_OPEN_SHIFT'
  | 'TABLE_BUSY'
  | 'CONFLICT'
  | 'DATABASE_UNAVAILABLE'
  | 'UNKNOWN'

export interface StaffMessage {
  title: string
  message: string
  hint?: string
}

const MESSAGES: Record<StaffFacingCode, StaffMessage> = {
  AUTH_REQUIRED: {
    title: 'Please sign in again',
    message: 'Your session has ended. Sign in to continue.',
  },
  AUTH_EXPIRED: {
    title: 'Session expired',
    message: 'You were signed out for security. Sign in again to carry on.',
  },
  FORBIDDEN: {
    title: 'Not allowed',
    message: 'Your role does not have access to this. Ask a manager if you need it.',
  },
  PENDING_APPROVAL: {
    title: 'Waiting for approval',
    message: 'An administrator needs to approve your account before you can use the system.',
    hint: 'Ask your manager to approve you, then sign in again.',
  },
  VALIDATION: {
    title: 'Check the details',
    message: 'Some of the information was not accepted. Review the form and try again.',
  },
  NOT_FOUND: {
    title: 'Not found',
    message: 'That record no longer exists. It may have been removed by someone else.',
    hint: 'Refresh the list to see what is there now.',
  },
  RATE_LIMITED: {
    title: 'Too many attempts',
    message: 'You have tried that several times. Wait a moment before trying again.',
    hint: 'This protects the system from automated abuse.',
  },
  OFFLINE: {
    title: 'No connection',
    message: 'This device cannot reach the club server. Check the WiFi and try again.',
    hint: 'A payment already taken is safe and will still be recorded once the connection returns.',
  },
  PRODUCT_UNAVAILABLE: {
    title: 'Item no longer available',
    message: 'Something in the cart is not being sold right now.',
    hint: 'Remove it from the cart and take the order again.',
  },
  INSUFFICIENT_STOCK: {
    title: 'Not enough stock',
    message: 'There is not enough stock left to complete this order.',
    hint: 'Check the inventory, then adjust the quantity or the order.',
  },
  INVALID_PHONE: {
    title: 'Check the number',
    message: 'That is not a valid Kenyan mobile number.',
    hint: 'Enter it as 07XX XXX XXX, for example 0712 345 678.',
  },
  PAYMENT_DECLINED: {
    title: 'Payment did not go through',
    message: 'The customer was not charged. Ask them to try again, or take cash.',
  },
  PAYMENT_TIMEOUT: {
    title: 'Payment provider is slow',
    message: 'We did not hear back from the payment provider in time.',
    hint: 'Check the customer’s phone before trying again, so they are not charged twice.',
  },
  PAYMENT_NOT_CONFIGURED: {
    title: 'Payments not set up',
    message: 'Mobile money has not been configured for this club yet.',
    hint: 'An administrator needs to add the payment credentials in settings.',
  },
  PAYMENT_PROVIDER_ERROR: {
    title: 'Payment provider problem',
    message: 'The payment provider could not be reached. No money has left the customer.',
    hint: 'Try cash, or try again in a moment.',
  },
  SHIFT_ALREADY_OPEN: {
    title: 'Shift already open',
    message: 'There is a shift open for you already. Manage that one instead.',
  },
  NO_OPEN_SHIFT: {
    title: 'No open shift',
    message: 'Open a shift before recording cash takings.',
  },
  TABLE_BUSY: {
    title: 'Table in use',
    message: 'That table already has a table running on it.',
    hint: 'Open the existing tab, or choose another table.',
  },
  CONFLICT: {
    title: 'Someone got there first',
    message: 'This was changed by someone else while you were working on it.',
    hint: 'Refresh to see the current state, then try again.',
  },
  DATABASE_UNAVAILABLE: {
    title: 'Cannot reach the system',
    message: 'The system could not save this. Nothing has been recorded.',
    hint: 'Wait a moment and try again. If it keeps happening, tell your manager.',
  },
  UNKNOWN: {
    title: 'Something went wrong',
    message: 'That did not work. Nothing was saved.',
    hint: 'Try again. If it keeps happening, tell your manager.',
  },
}

/** Look up a message, falling back to UNKNOWN so nothing ever renders blank. */
export function staffMessage(code: StaffFacingCode): StaffMessage {
  return MESSAGES[code] ?? MESSAGES.UNKNOWN
}

/** Convenience for the client: the code plus the copy in one payload. */
export function staffErrorBody(code: StaffFacingCode, technical?: string) {
  const message = staffMessage(code)
  return {
    code,
    title: message.title,
    message: message.message,
    hint: message.hint,
    // The detail is for the terminal and bug reports. It is never rendered as
    // the headline, because it reads like a machine talking to a machine.
    detail: technical,
  }
}

/**
 * Human-readable text for a failed action, for toasts and alerts.
 * One string so a component can drop it straight into an `alert()`.
 */
export function staffErrorText(code: StaffFacingCode): string {
  const message = staffMessage(code)
  return message.hint ? `${message.message} ${message.hint}` : message.message
}
