import type { ApiErrorBody } from './types'

export class ApiError extends Error {
  readonly code: ApiErrorBody['code']
  readonly httpStatus?: number
  readonly details?: unknown
  readonly requestId?: string

  constructor(body: ApiErrorBody, httpStatus?: number) {
    super(body.message)
    this.code = body.code
    this.httpStatus = httpStatus
    this.details = body.details
    this.requestId = body.requestId
  }
}

function normalizeErrorBody(input: unknown): ApiErrorBody {
  if (typeof input !== 'object' || input === null) {
    return { code: 'UNKNOWN', message: '未知错误', details: input }
  }
  const obj = input as Record<string, unknown>
  const code = typeof obj.code === 'string' ? (obj.code as ApiErrorBody['code']) : 'UNKNOWN'
  const message = typeof obj.message === 'string' ? obj.message : '未知错误'
  return { code, message, details: obj.details, requestId: typeof obj.requestId === 'string' ? obj.requestId : undefined }
}

export async function fetchJson<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const headers = new Headers(init?.headers)
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const res = await fetch(path, {
    ...init,
    headers,
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  })

  const text = await res.text()
  const data = text ? (JSON.parse(text) as unknown) : undefined

  if (!res.ok) {
    throw new ApiError(normalizeErrorBody(data), res.status)
  }

  return data as T
}

