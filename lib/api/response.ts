import { NextResponse } from 'next/server'
import { z } from 'zod'
import { staffErrorBody, type StaffFacingCode } from '@/lib/errors'

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown> | z.ZodIssue[]
  timestamp: string
  path: string
}

export interface ApiSuccess<T> {
  data: T
  timestamp: string
}

export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown> | z.ZodIssue[],
  path?: string
): NextResponse {
  const body: ApiError = {
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
    path: path ?? '',
  }
  return NextResponse.json(body, { status })
}

/**
 * An error shaped for staff.
 *
 * The distinction that matters: `message` is written for the person using the
 * system, and `detail` carries the technical reason for whoever is fixing it.
 * A waiter should never see "unexpected token '<'" or a provider's HTML error
 * page; they should see "Payment provider problem" and be told that no money
 * has left the customer.
 */
export interface StaffApiError {
  code: StaffFacingCode
  title: string
  message: string
  hint?: string
  detail?: string
  timestamp: string
  path: string
}

/**
 * Build a response from the staff-facing message registry.
 *
 * `technical` is returned only as `detail`, which the client writes to the
 * console rather than rendering on screen.
 */
export function staffErrorResponse(
  code: StaffFacingCode,
  status: number,
  technical?: string,
  path?: string
): NextResponse {
  const copy = staffErrorBody(code, technical)
  const body: StaffApiError = {
    ...copy,
    timestamp: new Date().toISOString(),
    path: path ?? '',
  }
  return NextResponse.json(body, { status })
}

/** An unexpected failure: still a sentence for staff, detail for the log. */
export function unexpectedErrorResponse(
  error: unknown,
  status: number,
  path: string,
  code: StaffFacingCode = 'UNKNOWN'
): NextResponse {
  const technical = error instanceof Error ? error.message : String(error)
  const copy = staffErrorBody(code, technical)
  const body: StaffApiError = {
    ...copy,
    timestamp: new Date().toISOString(),
    path,
  }
  return NextResponse.json(body, { status })
}

export function successResponse<T>(data: T): NextResponse {
  const body: ApiSuccess<T> = {
    data,
    timestamp: new Date().toISOString(),
  }
  return NextResponse.json(body, { status: 200 })
}

export function createdResponse<T>(data: T): NextResponse {
  const body: ApiSuccess<T> = {
    data,
    timestamp: new Date().toISOString(),
  }
  return NextResponse.json(body, { status: 201 })
}

export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const