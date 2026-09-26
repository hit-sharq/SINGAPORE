import { ApiError } from './response'
import { z } from 'zod'

export class ApiResponseError extends Error {
  code: string
  status: number
  details?: Record<string, unknown> | z.ZodIssue[]
  path: string
  timestamp: string

  constructor(error: ApiError, status: number) {
    super(error.message)
    this.name = 'ApiResponseError'
    this.code = error.code
    this.status = status
    this.details = error.details
    this.path = error.path
    this.timestamp = error.timestamp
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type')
  const isJson = contentType?.includes('application/json')

  if (!response.ok) {
    const errorData = isJson ? await response.json() : { message: await response.text() }
    throw new ApiResponseError({
      code: errorData.code || 'INTERNAL_ERROR',
      message: errorData.message || 'Request failed',
      details: errorData.details,
      timestamp: errorData.timestamp || new Date().toISOString(),
      path: errorData.path || '',
    }, response.status)
  }

  if (!isJson) {
    return {} as T
  }

  const data = await response.json()

  if (data.data !== undefined) {
    return data.data as T
  }

  return data as T
}

export async function apiGet<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  return parseResponse<T>(response)
}

export async function apiPost<T>(url: string, body: unknown, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(body),
    ...options,
  })
  return parseResponse<T>(response)
}

export async function apiPut<T>(url: string, body: unknown, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(body),
    ...options,
  })
  return parseResponse<T>(response)
}

export async function apiPatch<T>(url: string, body: unknown, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(body),
    ...options,
  })
  return parseResponse<T>(response)
}

export async function apiDelete<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  return parseResponse<T>(response)
}

export function isApiError(error: unknown): error is ApiResponseError {
  return error instanceof ApiResponseError
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiResponseError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unknown error occurred'
}