import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import type { ApplicationStage } from '../types'
import { jobsApi } from '../api/services'
import { ArrowLeft, Clock, ShieldCheck, Sparkles } from 'lucide-react'

const STAGES: { stage: ApplicationStage; label: string; defaultHours: number; note: string }[] = [
  { stage: 'APPLIED', label: 'Initial Screening', defaultHours: 40, note: '5 business days' },
  { stage: 'SCREENING', label: 'Hiring Manager Review', defaultHours: 24, note: '3 business days' },
  { stage: 'SHORTLISTED', label: 'Interview Scheduling', defaultHours: 16, note: '2 business days' },
  { stage: 'INTERVIEW', label: 'Rounds & Evaluation', defaultHours: 40, note: '5 business days' },
  { stage: 'OFFERED', label: 'Offer Release', defaultHours: 24, note: '3 business days' },
]

export default function PostJob() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [department, setDepartment] = useState('Engineering')
  const [location, setLocation] = useState('Bengaluru, India (Hybrid)')
  const [description, setDescription] = useState('')
  const [slas, setSlas] = useState<Record<ApplicationStage, number>>({
    APPLIED: 40,
    SCREENING: 24,
    SHORTLISTED: 16,
    INTERVIEW: 40,
    OFFERED: 24,
    HIRED: 0,
    REJECTED: 0,
    WITHDRAWN: 0,
    STALE_BREACHED: 0,
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await jobsApi.create({
        title,
        department,
        location,
        description,
        stageConfigs: STAGES.map(({ stage }) => ({ stage, slaBusinessHours: slas[stage] })),
      })
      navigate('/jobs')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create job posting. Please check inputs.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-5">
        
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to roles
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 sm:p-8 space-y-6">
          <div>
            <span className="text-[11px] font-bold text-accent-700 uppercase tracking-widest bg-accent-50 border border-accent-100 px-2 py-0.5 rounded">
              Employer Console • SLA Binding
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Publish New Position
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Every position on CareerSync requires agreed response timeframes. Your responsiveness score will be measured against these SLAs.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Job Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Backend Engineer (Java / Spring)"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
              />
            </div>

            {/* Department & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Engineering, Product"
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Location / Workplace Type
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bengaluru / Remote"
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Role Description & Requirements
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe role impact, key technical skills, stack, and interview processâ€¦"
                className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-normal"
              />
            </div>

            {/* SLA Configuration */}
            <div className="pt-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-4 h-4 text-brand-600" />
                <label className="text-xs font-bold text-slate-900">
                  Stage Review SLA Windows (Business Hours)
                </label>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Calculated in active IST working hours (09:30â€“18:30 Monâ€“Fri), automatically skipping weekends and holidays.
              </p>

              <div className="space-y-2.5">
                {STAGES.map(({ stage, label, note }) => (
                  <div
                    key={stage}
                    className="flex items-center justify-between p-3 bg-slate-50/70 border border-slate-200/80 rounded-md text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{label}</span>
                      <span className="text-slate-400 block text-[10px]">{stage} â€¢ Approx. {note}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={8}
                        max={160}
                        step={8}
                        value={slas[stage]}
                        onChange={(e) => setSlas({ ...slas, [stage]: Number(e.target.value) })}
                        className="w-16 text-center font-mono font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:outline-none"
                      />
                      <span className="text-slate-400 font-medium text-[11px]">hours</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-md">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm py-2.5 rounded-md shadow-sm shadow-brand-600/20 disabled:opacity-50 transition-all hover:shadow-md"
            >
              {saving ? 'Publishing Positionâ€¦' : 'Publish Role with SLA Guarantee'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}

