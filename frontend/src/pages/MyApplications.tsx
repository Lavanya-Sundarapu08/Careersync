import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ApplicationSummary } from '../types'
import { applicationsApi } from '../api/services'
import SlaProgressBar from '../components/SlaProgressBar'
import { Clock, CheckCircle2, AlertOctagon, XCircle, ArrowRight, Briefcase, FileText, ChevronRight, Sparkles, Check, Download } from 'lucide-react'

export default function MyApplications() {
  const [apps, setApps] = useState<ApplicationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'OFFERED' | 'CLOSED'>('ALL')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  function load() {
    applicationsApi.mine()
      .then((res) => setApps(res.data.data))
      .catch((err) => console.error("Error loading applications:", err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleDownloadResume(appId: string) {
    setDownloadingId(appId)
    const previewTab = window.open('about:blank', '_blank')
    if (previewTab) {
      previewTab.document.write(
        '<!DOCTYPE html><html><head><title>Loading Resume...</title>' +
        '<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc;color:#334155;}' +
        '.box{text-align:center;padding:24px;background:#fff;border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 4px 6px -1px rgb(0 0 0/0.1);}' +
        '</style></head><body><div class="box"><h3>Retrieving Candidate Dossier...</h3><p>Preparing verified PDF document.</p></div></body></html>'
      )
    }
    try {
      const res = await applicationsApi.downloadResume(appId)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const blobUrl = window.URL.createObjectURL(blob)
      if (previewTab) {
        previewTab.location.href = blobUrl
      } else {
        window.open(blobUrl, '_blank')
      }
    } catch (err: any) {
      if (previewTab) previewTab.close()
      alert(err?.response?.data?.message || 'Failed to download resume PDF')
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleWithdraw(id: string) {
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) return
    try {
      await applicationsApi.withdraw(id)
      load()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to withdraw application')
    }
  }

  const activeApps = apps.filter((a) => !['HIRED', 'REJECTED', 'WITHDRAWN', 'STALE_BREACHED'].includes(a.currentStage))
  const breachedApps = apps.filter((a) => a.breached || a.currentStage === 'STALE_BREACHED')
  const offeredApps = apps.filter((a) => a.currentStage === 'OFFERED' || a.currentStage === 'HIRED')

  const displayedApps = apps.filter((app) => {
    if (filter === 'ACTIVE') return !['HIRED', 'REJECTED', 'WITHDRAWN', 'STALE_BREACHED'].includes(app.currentStage)
    if (filter === 'OFFERED') return app.currentStage === 'OFFERED' || app.currentStage === 'HIRED'
    if (filter === 'CLOSED') return ['REJECTED', 'WITHDRAWN', 'STALE_BREACHED'].includes(app.currentStage)
    return true
  })

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-pulse" />
              <span>LIVE APPLICATION TRACKER</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Applications
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Active stage pipelines with countdown timers and guaranteed response deadlines.
            </p>
          </div>
          <Link
            to="/jobs"
            className="self-start sm:self-auto inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-all"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Explore More Roles</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Submissions</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{apps.length}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-brand-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider block">In Active Review</span>
            <span className="text-2xl font-extrabold text-brand-700 mt-1 block">{activeApps.length}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Shortlisted / Offers</span>
            <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">{offeredApps.length}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">SLA Breached</span>
            <span className="text-2xl font-extrabold text-rose-700 mt-1 block">{breachedApps.length}</span>
          </div>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-lg border border-slate-200/60 w-fit">
          {(['ALL', 'ACTIVE', 'OFFERED', 'CLOSED'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                filter === t
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t === 'ALL' ? 'All Roles' : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse h-32" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {displayedApps.map((app) => {
              const isClosed = ['HIRED', 'REJECTED', 'WITHDRAWN', 'STALE_BREACHED'].includes(app.currentStage)
              return (
                <div
                  key={app.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs hover:border-brand-400 hover:shadow-card transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/applications/${app.id}`}
                          className="font-bold text-base sm:text-lg text-slate-900 hover:text-brand-600 transition-colors flex items-center gap-1 group"
                        >
                          <span>{app.jobTitle}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                        </Link>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                          #APP-{app.id.slice(0, 6)}
                        </span>
                        {app.atsScore !== undefined && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            app.atsScore >= 80
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : app.atsScore >= 60
                              ? 'bg-brand-50 text-brand-700 border border-brand-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            <Sparkles className="w-3 h-3" />
                            {app.atsScore}% ATS Match
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="font-bold text-brand-700">Verified Application</span>
                        <span>•</span>
                        <span>Applied on {new Date(app.stageEnteredAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>

                      {/* Matched skills pill preview */}
                      {app.matchedSkills && app.matchedSkills.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span className="text-[11px] text-slate-400 font-medium">Extracted Core Skills:</span>
                          {app.matchedSkills.slice(0, 4).map((skill, idx) => (
                            <span key={idx} className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded">
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                        app.currentStage === 'OFFERED' || app.currentStage === 'HIRED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : app.breached || app.currentStage === 'STALE_BREACHED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-brand-50 text-brand-700 border border-brand-200'
                      }`}>
                        {app.currentStage.replace('_', ' ')}
                      </span>

                      {!isClosed && (
                        <button
                          onClick={() => handleWithdraw(app.id)}
                          className="text-xs text-slate-400 hover:text-rose-600 font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar Container */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80">
                    <SlaProgressBar
                      stageEnteredAt={app.stageEnteredAt}
                      slaDeadlineAt={app.slaDeadlineAt}
                      breached={app.breached}
                    />
                  </div>

                  {/* Footer links */}
                  <div className="flex items-center justify-between pt-1">
                    {app.resumeObjectKey ? (
                      <button
                        onClick={() => handleDownloadResume(app.id)}
                        disabled={downloadingId === app.id}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-brand-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-md transition-all disabled:opacity-50"
                      >
                        <FileText className="w-3.5 h-3.5 text-brand-600" />
                        <span>{downloadingId === app.id ? 'Loading Dossier…' : 'View Submitted CV (PDF)'}</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    <Link
                      to={`/applications/${app.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                    >
                      <span>View Full Stage Timeline</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )
            })}

            {displayedApps.length === 0 && (
              <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 text-base">No applications in this category</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Browse open positions with guaranteed SLA deadlines and submit your profile.
                </p>
                <Link
                  to="/jobs"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg transition-all shadow-xs"
                >
                  Browse Open Jobs
                </Link>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
