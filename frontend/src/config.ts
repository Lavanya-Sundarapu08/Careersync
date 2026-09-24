/**
 * Returns the backend base URL.
 * - In production (Vercel): uses VITE_API_URL env var set to your Render URL
 * - In local dev: falls back to http://localhost:8080
 */
export const API_BASE_URL =
  (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/api\/?$/, '').replace(/\/+$/, '')

/**
 * Google OAuth2 authorization URL for candidates.
 * Points to the backend which handles the redirect to Google.
 */
export const GOOGLE_OAUTH_CANDIDATE_URL =
  `${API_BASE_URL}/oauth2/authorization/google?role=CANDIDATE`
