import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AlertCircle, CheckCircle } from 'lucide-react'

export default function OAuth2Callback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { loginWithTokens } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const accessToken = searchParams.get('accessToken')
    const refreshToken = searchParams.get('refreshToken')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setError(
        errorParam === 'email_not_provided'
          ? 'Google did not return an email address. Please allow email access to sign in.'
          : `Authentication failed: ${errorParam}`
      )
      return
    }

    if (accessToken && refreshToken) {
      try {
        loginWithTokens(accessToken, refreshToken)
        const timeout = setTimeout(() => {
          navigate('/jobs', { replace: true })
        }, 500)
        return () => clearTimeout(timeout)
      } catch (err: any) {
        setError('Failed to process authentication tokens. Please try again.')
      }
    } else {
      setError('Missing authentication tokens in callback URL.')
    }
  }, [searchParams, loginWithTokens, navigate])

  if (error) {
    return (
      <div className="min-h-screen bg-[#fbfcfe] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 shadow-soft p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Sign In Failed</h2>
          <p className="text-xs text-slate-600">{error}</p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fbfcfe] flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-2xl border border-slate-100 shadow-soft p-8 text-center space-y-4">
        <div className="w-12 h-12 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto" />
        <h3 className="text-base font-bold text-slate-900">Signing you in…</h3>
        <p className="text-xs text-slate-500">Completing secure Google authentication with CareerSync JWT.</p>
      </div>
    </div>
  )
}
