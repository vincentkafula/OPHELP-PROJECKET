/**
 * Thin fetch wrapper for the OPHELP backend.
 *
 * In production the backend serves the built frontend from the same origin,
 * so the default base is a relative `/api`. In local dev, point
 * VITE_API_URL at wherever `npm run dev` in /backend is listening
 * (see frontend/.env.example).
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'ophelp_auth_token_v2'

export interface StoredAuth {
  token: string
  user: Record<string, unknown>
}

export function getStoredAuth(): StoredAuth | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY)
    return raw ? (JSON.parse(raw) as StoredAuth) : null
  } catch {
    return null
  }
}

export function setStoredAuth(auth: StoredAuth | null) {
  if (auth) sessionStorage.setItem(TOKEN_KEY, JSON.stringify(auth))
  else sessionStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const auth = getStoredAuth()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  if (auth?.token) headers.Authorization = `Bearer ${auth.token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  const body = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(body?.error || `Request failed: ${res.status} ${res.statusText}`)
  }
  return body as T
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
