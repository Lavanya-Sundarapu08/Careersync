import React, { createContext, useContext, useEffect, useState } from 'react'
import type { UserSummary } from '../types'
import { authApi } from '../api/services'

interface AuthContextValue {
  user: UserSummary | null
  login: (email: string, password: string) => Promise<void>
  register: (payload: { email: string; password: string; fullName: string; role: string; companySlug?: string }) => Promise<void>
  loginWithTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(() => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user))
    else localStorage.removeItem('user')
  }, [user])

  async function login(email: string, password: string) {
    const { data } = await authApi.login(email, password)
    persist(data.data)
  }

  async function register(payload: { email: string; password: string; fullName: string; role: string; companySlug?: string }) {
    const { data } = await authApi.register(payload)
    persist(data.data)
  }

  function loginWithTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    const payload = parseJwt(accessToken)
    if (payload) {
      const userSummary: UserSummary = {
        id: payload.userId,
        email: payload.sub,
        fullName: payload.sub.split('@')[0],
        role: payload.role,
      }
      setUser(userSummary)
    }
  }

  function persist(token: { accessToken: string; refreshToken: string; user: UserSummary }) {
    localStorage.setItem('accessToken', token.accessToken)
    localStorage.setItem('refreshToken', token.refreshToken)
    setUser(token.user)
  }

  function logout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithTokens, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
