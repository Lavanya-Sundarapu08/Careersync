import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse, TokenResponse } from '../types'

function getBaseUrl(): string {
  const url = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL
  if (!url) return '/api'
  const trimmed = url.replace(/\/+$/, '')
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

const BASE_URL = getBaseUrl()

export const client = axios.create({ baseURL: BASE_URL })

// ---- Request interceptor: inject the current access token ----
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ---- Response interceptor: on 401, rotate the refresh token once, then retry ----
let isRefreshing = false
let queue: Array<() => void> = []

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = localStorage.getItem('refreshToken')

      if (!refreshToken) {
        redirectToLogin()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          queue.push(() => resolve(client(original)))
        })
      }

      isRefreshing = true
      try {
        const { data } = await axios.post<ApiResponse<TokenResponse>>(
          `${BASE_URL}/auth/refresh`,
          { refreshToken }
        )
        localStorage.setItem('accessToken', data.data.accessToken)
        localStorage.setItem('refreshToken', data.data.refreshToken)
        queue.forEach((cb) => cb())
        queue = []
        return client(original)
      } catch (refreshError) {
        redirectToLogin()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

function redirectToLogin() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

export default client
