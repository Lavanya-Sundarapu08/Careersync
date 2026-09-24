import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Building2, ShieldCheck, ArrowRight, Lock, Mail, User, AlertCircle, CheckCircle, Briefcase, UserCheck, Layers } from 'lucide-react'
import { GOOGLE_OAUTH_CANDIDATE_URL } from '../config'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'CANDIDATE',
    companySlug: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register(form)
      navigate('/jobs')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed. Please check your details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">

      {/* Left branding panel (Midnight Ink with Electric Cobalt accents) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-slate-950 p-12 relative overflow-hidden text-white border-r border-slate-900">
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
            <span>Anti-Ghosting Network</span>
          </div>
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight">
              End ghosting.<br />Start hiring with integrity.
            </h2>
            <p className="mt-3 text-slate-400 text-sm leading-relaxed">
              Join the platform where every application comes with a guaranteed response timeline and public employer accountability.
            </p>
          </div>
          <ul className="space-y-3 pt-2">
            {[
              'SLA-enforced feedback at every recruitment stage',
              'Public responsiveness reliability scores for all employers',
              'ATS pre-screening ensuring only high-fit talent reviews',
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
          <span>Guaranteed recruiter transparency on every submission</span>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white overflow-y-auto">
        <div className="w-full max-w-sm space-y-6">

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
            <p className="mt-1 text-xs text-slate-500">
              Join CareerSync — the SLA-guaranteed recruitment network
            </p>
          </div>

          {/* Role Tabs */}
          <div className="flex rounded-lg border border-slate-200 p-1 gap-1 bg-slate-100/70">
            <button
              type="button"
              onClick={() => setForm({ ...form, role: 'CANDIDATE' })}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-md transition-all ${
                form.role === 'CANDIDATE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-brand-600" />
              <span>Job Seeker</span>
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, role: 'RECRUITER' })}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-md transition-all ${
                form.role === 'RECRUITER'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-brand-600" />
              <span>Employer</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Full name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="e.g. Alex Sharma"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {form.role === 'RECRUITER' ? 'Official corporate work email' : 'Email address'}
                </label>
                {form.role === 'RECRUITER' && (
                  <span className="text-[10px] font-bold text-accent-700 bg-accent-50 border border-accent-100 px-1.5 py-0.5 rounded">
                    Work Email Only
                  </span>
                )}
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder={form.role === 'RECRUITER' ? 'recruiter@company.com' : 'candidate@example.com'}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all placeholder:text-slate-400"
                />
              </div>
              {form.role === 'RECRUITER' && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Public email providers (@gmail, @yahoo) are prohibited for recruiters.
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Password (min. 8 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {form.role === 'RECRUITER' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Company handle / slug
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={form.companySlug}
                    onChange={(e) => setForm({ ...form, companySlug: e.target.value })}
                    placeholder="e.g. acme-fintech"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all placeholder:text-slate-400"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Links your recruiter account to your company's SLA profile.
                </p>
              </div>
            )}

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
                  <span>Creating Account…</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {form.role === 'CANDIDATE' && (
              <>
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2.5 text-slate-400 font-medium">Or join as candidate with</span>
                  </div>
                </div>

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
                  <span>Sign up with Google (Candidates)</span>
                </a>
              </>
            )}
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
