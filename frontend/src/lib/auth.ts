/**
 * Authentication service — talks to the real backend (/api/auth/*) and
 * caches the JWT + safe user object in sessionStorage so `currentUser()`
 * and `isAuthenticated()` can stay synchronous for existing call sites.
 */

import { api } from './apiClient'
import { getStoredAuth, setStoredAuth } from './apiClient'
import type { LoginResult, SystemUser, UserRole } from './types'

type SafeUser = Omit<SystemUser, 'passwordHash'>

export const AuthService = {
  async login(email: string, password: string): Promise<LoginResult> {
    try {
      const res = await api.post<{ success: boolean; user?: SafeUser; token?: string; error?: string }>(
        '/auth/login',
        { email, password }
      )
      if (!res.success || !res.user || !res.token) {
        return { success: false, error: res.error ?? 'Invalid email or password.' }
      }
      setStoredAuth({ token: res.token, user: res.user })
      return { success: true, user: res.user, token: res.token }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Login failed.' }
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout')
    } catch {
      // Non-fatal — clear local session regardless.
    }
    setStoredAuth(null)
  },

  currentUser(): SafeUser | null {
    return (getStoredAuth()?.user as SafeUser | undefined) ?? null
  },

  isAuthenticated(): boolean {
    return getStoredAuth() !== null
  },

  hasRole(...roles: UserRole[]): boolean {
    const user = this.currentUser()
    return !!user && roles.includes(user.role)
  },
}
