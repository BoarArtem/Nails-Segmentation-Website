/**
 * Typed fetch wrapper for the auth + nail-segmentation API exposed by the FastAPI backend.
 *
 * Contract (see backend/app/api/routes/auth.py):
 *  - POST /api/auth/register  { email, password } -> 201 { id, email }        | 409 email taken
 *  - POST /api/auth/login     { email, password } -> 200 { access_token, token_type } | 401 bad creds
 *  - GET  /api/auth/me        Authorization: Bearer <token> -> 200 { id, email }      | 401 invalid/missing
 *
 * Contract (see backend/app/api/routes/segmentation.py):
 *  - POST /api/nails/segment  multipart/form-data { file }, Authorization: Bearer <token>
 *      -> 200 { nail_count, detections, annotated_image }
 *      | 400 not a readable image | 401 unauthenticated | 413 file too large | 500 server error
 */

export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

export interface AuthUser {
  id: number
  email: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface ApiErrorBody {
  detail?: string
}

/** Error thrown for any non-2xx response from the API. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody
    if (typeof body.detail === 'string' && body.detail.length > 0) {
      return body.detail
    }
  } catch {
    // response had no/invalid JSON body — fall through to generic message
  }
  return `Request failed with status ${response.status}`
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response))
  }

  return (await response.json()) as T
}

/**
 * Like `request`, but for multipart/form-data bodies (e.g. file uploads).
 * Deliberately omits a `Content-Type` header so the browser can set the
 * correct `multipart/form-data; boundary=...` value itself. Reuses the same
 * error-parsing behavior as `request` so callers get consistent `ApiError`s.
 */
async function requestForm<T>(path: string, formData: FormData, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    body: formData,
  })

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response))
  }

  return (await response.json()) as T
}

export function registerUser(email: string, password: string): Promise<AuthUser> {
  return request<AuthUser>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function loginUser(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function fetchCurrentUser(token: string): Promise<AuthUser> {
  return request<AuthUser>('/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

/** A single detected/segmented nail instance. */
export interface NailDetection {
  id: number
  confidence: number
  /** Bounding box in pixel coordinates: [x1, y1, x2, y2]. */
  bbox: [number, number, number, number]
  /** Segmentation mask contour as a list of [x, y] pixel points. */
  polygon: [number, number][]
}

/** Response body for POST /api/nails/segment. */
export interface SegmentationResponse {
  nail_count: number
  detections: NailDetection[]
  /** Ready-to-use data URL (e.g. "data:image/png;base64,...") with masks drawn on it. */
  annotated_image: string
}

/**
 * Runs nail detection/segmentation on `file` for the authenticated user.
 * Throws `ApiError` with status 400 (undecodable image), 401 (unauthenticated),
 * 413 (file too large), or 500 (server error) — see backend contract above.
 */
export function segmentImage(token: string, file: File): Promise<SegmentationResponse> {
  const formData = new FormData()
  formData.append('file', file)

  return requestForm<SegmentationResponse>('/nails/segment', formData, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
