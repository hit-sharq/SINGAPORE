import { NextResponse } from 'next/server'
import { z } from 'zod'

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