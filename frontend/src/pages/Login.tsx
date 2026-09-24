import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ShieldCheck, ArrowRight, Lock, Mail, AlertCircle, CheckCircle, Building2, UserCheck, Shield, Layers } from 'lucide-react'
import { GOOGLE_OAUTH_CANDIDATE_URL } from '../config'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/jobs')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid email or password. Please verify your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">

      {/* Left branding panel (Midnight Ink with Electric Cobalt accents) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-slate-950 p-12 relative overflow-hidden text-white border-r border-slate-900">
        {/* Subtle background ambient light */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-glow-cobalt">
              <Layers className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">Career<span className="text-brand-500">Sync</span></span>
          </Link>
        </div>

        <div className="space-y-6 relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-brand-300 border border-white/10 backdrop-blur-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
            <span>Guaranteed Feedback Protocol</span>
          </div>
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight">
              Recruitment that works for both sides.
            </h2>
            <p className="mt-3 text-slate-400 text-sm leading-relaxed">
              Sign in to track live SLA countdowns, review verified response metrics, and eliminate recruitment ghosting.
            </p>
          </div>
          <ul className="space-y-3 pt-2">
            {[
              'Legally tracked business-hour deadlines for every review stage',
              'Automated breach flagging and public reliability metrics',
              'Verified employer credentials with corporate domain governance',
            ].map((point, idx) => (
              <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 relative z-10">
          <ShieldCheck className="w-4 h-4 text-brand-500" />
          <span>Stateless JWT Authentication • Enforced SLA Governance</span>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm space-y-6">

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
            <p className="mt-1 text-xs text-slate-500">
              Sign in to your CareerSync account or use evaluation access
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm py-2.5 rounded-lg shadow-xs hover:shadow-card disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* OAuth2 Divider */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2.5 text-slate-400 font-medium">Or continue with Google</span>
              </div>
            </div>

            {/* Candidate Google OAuth */}
            <a
              href={GOOGLE_OAUTH_CANDIDATE_URL}
              className="w-full inline-flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-all"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.44 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.24C.45 8.14 0 9.99 0 12s.45 3.86 1.24 5.43l4.04-3.14z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.56 1.24 6.57l4.04 3.14c.95-2.83 3.6-4.96 6.72-4.96z" />
              </svg>
              <span>Sign in with Google — Job Seeker</span>
            </a>

            <p className="text-[10px] text-center text-slate-400">
              Google sign-in is for Job Seekers. Recruiters sign in with work credentials below.
            </p>
          </form>

          {/* Quick 1-Click Demo Accounts for Interviewers / Evaluators */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Demo Accounts (1-Click Fill)
              </span>
              <span className="text-[10px] text-brand-700 font-bold bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200">
                EVALUATION
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('recruiter@acme.dev')
                  setPassword('Password@123')
                  setError(null)
                }}
                className="px-2.5 py-2 bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-300 rounded-lg text-xs font-semibold text-slate-700 hover:text-brand-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span>Demo Recruiter</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('candidate@example.dev')
                  setPassword('Password@123')
                  setError(null)
                }}
                className="px-2.5 py-2 bg-slate-50 hover:bg-accent-50 border border-slate-200 hover:border-accent-300 rounded-lg text-xs font-semibold text-slate-700 hover:text-accent-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-accent-600 shrink-0" />
                <span>Demo Candidate</span>
              </button>
            </div>
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@careersync.dev')
                  setPassword('Password@123')
                  setError(null)
                }}
                className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1"
              >
                <Shield className="w-3 h-3 text-slate-400" />
                <span>or autofill Platform Admin (`admin@careersync.dev`)</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700 underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
