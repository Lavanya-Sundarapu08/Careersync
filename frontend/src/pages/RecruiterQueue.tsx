import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { ApplicationStage, ApplicationSummary } from '../types'
import { applicationsApi } from '../api/services'
import SlaProgressBar from '../components/SlaProgressBar'
import { 
  Users, AlertTriangle, CheckCircle2, ShieldAlert, Search, Filter, 
  FileText, MessageSquare, ArrowRight, X, ChevronRight, Briefcase,
  Lock, Sparkles, Check, HelpCircle, Download, UserCheck
} from 'lucide-react'

const NEXT_STAGE: Partial<Record<ApplicationStage, ApplicationStage>> = {
  APPLIED: 'SCREENING',
  SCREENING: 'SHORTLISTED',
  SHORTLISTED: 'INTERVIEW',
  INTERVIEW: 'OFFERED',
  OFFERED: 'HIRED',
}

const STAGE_FILTERS: { label: string; value: string }[] = [
  { label: 'All Candidates', value: 'ALL' },
  { label: 'Applied', value: 'APPLIED' },
  { label: 'Screening', value: 'SCREENING' },
  { label: 'Shortlisted', value: 'SHORTLISTED' },
  { label: 'Interview', value: 'INTERVIEW' },
  { label: 'Offered', value: 'OFFERED' },
  { label: 'SLA Breached', value: 'BREACHED' },
]

export default function RecruiterQueue() {
  const [apps, setApps] = useState<ApplicationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [stageFilter, setStageFilter] = useState('ALL')
  const [atsFilter, setAtsFilter] = useState<'ALL' | 'HIGH' | 'GOOD'>('ALL')
  
  // Modal for advancing with feedback note
  const [transitionModal, setTransitionModal] = useState<{
    app: ApplicationSummary;
    targetStage: ApplicationStage;
  } | null>(null)
  const [recruiterNote, setRecruiterNote] = useState('')

  // Modal for reviewing resume and interview preparation
  const [resumeModal, setResumeModal] = useState<ApplicationSummary | null>(null)
  const [downloadingResume, setDownloadingResume] = useState(false)

  function load() {
    applicationsApi.queue()
      .then((res) => setApps(res.data.data))
      .catch((err) => console.error("Failed to load queue:", err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleAdvanceWithNote() {
    if (!transitionModal) return
    const { app, targetStage } = transitionModal
    setBusyId(app.id)
    try {
      await applicationsApi.transition(app.id, targetStage, recruiterNote.trim() || undefined)
      setTransitionModal(null)
      setRecruiterNote('')
      load()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update stage')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDownloadResume(appId: string, candidateName?: string) {
    setDownloadingResume(true)
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
      setDownloadingResume(false)
    }
  }

  async function handleSaveResume(appId: string, candidateName: string) {
    setDownloadingResume(true)
    try {
      const res = await applicationsApi.downloadResume(appId)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `${candidateName.replace(/\s+/g, '_')}_Resume.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000)
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to download resume PDF')
    } finally {
      setDownloadingResume(false)
    }
  }


  // Filtered applications
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      // Search matches
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch = !query || 
        app.candidateName.toLowerCase().includes(query) ||
        app.candidateEmail.toLowerCase().includes(query) ||
        app.jobTitle.toLowerCase().includes(query)

      // Stage matches
      let matchesStage = true
      if (stageFilter === 'BREACHED') {
        matchesStage = app.breached || app.currentStage === 'STALE_BREACHED'
      } else if (stageFilter !== 'ALL') {
        matchesStage = app.currentStage === stageFilter
      }

      // ATS filter matches
      let matchesAts = true
      const score = app.atsScore ?? 85
      if (atsFilter === 'HIGH') {
        matchesAts = score >= 80
      } else if (atsFilter === 'GOOD') {
        matchesAts = score >= 60 && score < 80
      }

      return matchesSearch && matchesStage && matchesAts
    })
  }, [apps, searchQuery, stageFilter, atsFilter])

  const breachedCount = apps.filter((a) => a.breached || a.currentStage === 'STALE_BREACHED').length
  const atRiskCount = apps.filter((a) => {
    if (!a.slaDeadlineAt || a.breached) return false
    const diffHours = (new Date(a.slaDeadlineAt).getTime() - Date.now()) / (1000 * 60 * 60)
    return diffHours > 0 && diffHours <= 24
  }).length
  const interviewLoopCount = apps.filter((a) => a.currentStage === 'SHORTLISTED' || a.currentStage === 'INTERVIEW').length

  return (
    <div className="min-h-screen bg-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Recruiter Candidate Queue
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Automated ATS relevancy scoring & SLA-prioritized candidate pipeline.
            </p>
          </div>
          <Link
            to="/recruiter/jobs/new"
            className="self-start sm:self-auto inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-all"
          >
            Post New Role
          </Link>
        </div>

        {/* Pipeline Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Awaiting Action</span>
              <Users className="w-4 h-4 text-brand-600" />
            </div>
            <span className="text-3xl font-extrabold text-slate-900 mt-2 block">{apps.length}</span>
            <span className="text-[11px] text-slate-500 mt-1 block">Active candidates in review</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">Interview Loop</span>
              <UserCheck className="w-4 h-4 text-brand-600" />
            </div>
            <span className="text-3xl font-extrabold text-brand-800 mt-2 block">{interviewLoopCount}</span>
            <span className="text-[11px] text-accent-700 mt-1 block">Selected &amp; CVs Unlocked</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Urgent (&lt;24h)</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-3xl font-extrabold text-amber-700 mt-2 block">{atRiskCount}</span>
            <span className="text-[11px] text-amber-700/80 mt-1 block">Near 80% SLA threshold</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">SLA Breached</span>
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            </div>
            <span className="text-3xl font-extrabold text-rose-700 mt-2 block">{breachedCount}</span>
            <span className="text-[11px] text-rose-700/80 mt-1 block">Overdue applications</span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-lg border border-slate-100 p-4 shadow-sm space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by candidate name, email, or roleâ€¦"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
            />
          </div>

          {/* Stage Filter Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1 mr-1" />
            {STAGE_FILTERS.map((f) => {
              const isSelected = stageFilter === f.value
              let count = 0
              if (f.value === 'ALL') count = apps.length
              else if (f.value === 'BREACHED') count = breachedCount
              else count = apps.filter(a => a.currentStage === f.value).length

              return (
                <button
                  key={f.value}
                  onClick={() => setStageFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/60 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* ATS Match Filter Tabs */}
          <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              ATS Scanner Filter:
            </span>
            <button
              onClick={() => setAtsFilter('ALL')}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition-all ${
                atsFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Resumes
            </button>
            <button
              onClick={() => setAtsFilter('HIGH')}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition-all inline-flex items-center gap-1.5 ${
                atsFilter === 'HIGH'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              <span>ðŸŽ¯ Top ATS Fit (80%+)</span>
              <span className="text-[10px] opacity-80 font-bold">
                ({apps.filter(a => (a.atsScore ?? 85) >= 80).length})
              </span>
            </button>
            <button
              onClick={() => setAtsFilter('GOOD')}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition-all inline-flex items-center gap-1.5 ${
                atsFilter === 'GOOD'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-slate-200'
              }`}
            >
              <span>âš¡ Good Fit (60-79%)</span>
              <span className="text-[10px] opacity-80 font-bold">
                ({apps.filter(a => (a.atsScore ?? 85) >= 60 && (a.atsScore ?? 85) < 80).length})
              </span>
            </button>
          </div>
        </div>

        {/* Candidate Queue List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-lg p-6 animate-pulse h-28" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApps.map((app) => {
              const next = NEXT_STAGE[app.currentStage]
              const isBusy = busyId === app.id
              const shortId = `APP-${app.id.slice(0, 6)}`

              return (
                <div
                  key={app.id}
                  className={`bg-white border rounded-lg p-5 sm:p-6 shadow-sm transition-all ${
                    app.breached
                      ? 'border-rose-200/80 hover:border-rose-300'
                      : 'border-slate-100 hover:border-brand-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/applications/${app.id}`}
                          className="font-bold text-lg text-slate-900 hover:text-brand-600 transition-colors flex items-center gap-1.5 group"
                        >
                          <span>{app.candidateName}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                        </Link>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                          #{shortId}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          app.breached
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-brand-50 text-brand-700 border border-brand-200'
                        }`}>
                          {app.currentStage}
                        </span>

                        {app.atsScore !== undefined && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            app.atsScore >= 80
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : app.atsScore >= 60
                              ? 'bg-sky-50 text-sky-700 border border-slate-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            <Sparkles className="w-3 h-3" />
                            {app.atsScore}% ATS Fit
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span>Role: <strong className="text-slate-700">{app.jobTitle}</strong></span>
                        <span>â€¢</span>
                        <span>{app.candidateEmail}</span>
                      </p>

                      {/* Matched skills pill preview */}
                      {app.matchedSkills && app.matchedSkills.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span className="text-[11px] text-slate-400 font-medium">Core Skills:</span>
                          {app.matchedSkills.slice(0, 4).map((skill, idx) => (
                            <span key={idx} className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                              {skill}
                            </span>
                          ))}
                          {app.matchedSkills.length > 4 && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              +{app.matchedSkills.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap sm:flex-nowrap">
                      {/* Progressive Disclosure Resume Button */}
                      {app.resumeObjectKey && (
                        app.resumeUnlocked ? (
                          <button
                            onClick={() => setResumeModal(app)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-2 rounded-md transition-all shadow-sm"
                            title="Candidate is shortlisted. Full resume and interview prep unlocked."
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Review Resume</span>
                          </button>
                        ) : (
                          <div
                            title="Candidate resume is protected. Advance candidate to SHORTLISTED to unlock full resume for interview."
                            className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200 px-3 py-2 rounded-md cursor-help"
                          >
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Resume Protected</span>
                          </div>
                        )
                      )}

                      {next && (
                        <button
                          disabled={isBusy}
                          onClick={() => setTransitionModal({ app, targetStage: next })}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg shadow-xs disabled:opacity-50 transition-all"
                        >
                          <span>Advance to {next}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        disabled={isBusy}
                        onClick={() => {
                          setRecruiterNote('')
                          setTransitionModal({ app, targetStage: 'REJECTED' })
                        }}
                        className="text-xs font-semibold text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-3 py-2 rounded-md transition-colors disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  </div>

                  {/* SLA Indicator */}
                  <div className="pt-3">
                    <SlaProgressBar
                      stageEnteredAt={app.stageEnteredAt}
                      slaDeadlineAt={app.slaDeadlineAt}
                      breached={app.breached}
                    />
                  </div>
                </div>
              )
            })}

            {filteredApps.length === 0 && (
              <div className="bg-white rounded-lg border border-dashed border-slate-200 p-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-800 text-base">No matching candidates found</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Try adjusting your search query or stage filters.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Advance or Decline Stage Modal with Optional Recruiter Note */}
        {transitionModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-lg border border-slate-100 shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                    transitionModal.targetStage === 'REJECTED'
                      ? 'bg-rose-50 border border-rose-200 text-rose-600'
                      : 'bg-brand-50 border border-brand-200 text-brand-600'
                  }`}>
                    {transitionModal.targetStage === 'REJECTED' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <MessageSquare className="w-4 h-4" />
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {transitionModal.targetStage === 'REJECTED'
                      ? 'Decline Candidate Application'
                      : `Advance to ${transitionModal.targetStage}`}
                  </h3>
                </div>
                <button
                  onClick={() => setTransitionModal(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  {transitionModal.targetStage === 'REJECTED' ? (
                    <span>You are about to decline <strong>{transitionModal.app.candidateName}</strong> for role <strong>{transitionModal.app.jobTitle}</strong>.</span>
                  ) : (
                    <span>Advancing candidate <strong>{transitionModal.app.candidateName}</strong> for role <strong>{transitionModal.app.jobTitle}</strong>.</span>
                  )}
                </p>
                <p className="text-slate-400 text-[11px]">
                  {transitionModal.targetStage === 'REJECTED'
                    ? 'This will conclude the recruitment process for this candidate and log your feedback into the immutable ledger.'
                    : 'The SLA clock will automatically reset according to your configured business-hour deadline for this stage.'}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  {transitionModal.targetStage === 'REJECTED'
                    ? 'Constructive Feedback Note (Optional â€” recorded in immutable audit ledger):'
                    : 'Recruiter Feedback Note (Optional â€” recorded in immutable audit log):'}
                </label>
                <textarea
                  rows={3}
                  value={recruiterNote}
                  onChange={(e) => setRecruiterNote(e.target.value)}
                  placeholder={
                    transitionModal.targetStage === 'REJECTED'
                      ? 'e.g. Profile does not match current backend distributed systems requirements. Kept on file for future openings.'
                      : 'e.g. Cleared technical screening; scheduled for hiring manager interview.'
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setTransitionModal(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdvanceWithNote}
                  disabled={busyId === transitionModal.app.id}
                  className={`px-5 py-2 text-white text-xs font-semibold rounded-md shadow-xs disabled:opacity-50 transition-all ${
                    transitionModal.targetStage === 'REJECTED'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                      : 'bg-brand-600 hover:bg-brand-700 shadow-brand-600/20'
                  }`}
                >
                  {busyId === transitionModal.app.id
                    ? 'Updatingâ€¦'
                    : transitionModal.targetStage === 'REJECTED'
                    ? 'Confirm & Decline'
                    : 'Confirm & Advance'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resume & Interview Preparation Modal (Progressive Disclosure) */}
        {resumeModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-lg border border-slate-100 shadow-2xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <span>{resumeModal.candidateName}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                        #APP-{resumeModal.id.slice(0, 6)}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Interview Candidate for: <strong className="text-slate-700">{resumeModal.jobTitle}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setResumeModal(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ATS Screening Card */}
              <div className="bg-slate-50 rounded-md border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                    ATS Automated Match Analysis
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    (resumeModal.atsScore ?? 85) >= 80
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : (resumeModal.atsScore ?? 85) >= 60
                      ? 'bg-brand-50 text-brand-700 border border-brand-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {resumeModal.atsScore ?? 85}% Match â€¢ {(resumeModal.fitCategory || 'STRONG_FIT').replace('_', ' ')}
                  </span>
                </div>

                {/* Skills Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      Verified Core Skills
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {resumeModal.matchedSkills && resumeModal.matchedSkills.length > 0 ? (
                        resumeModal.matchedSkills.map((s, i) => (
                          <span key={i} className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">None detected</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      Gap / Growth Areas
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {resumeModal.missingSkills && resumeModal.missingSkills.length > 0 ? (
                        resumeModal.missingSkills.map((s, i) => (
                          <span key={i} className="text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-emerald-600 italic">No significant gaps</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Suggested Interview Questions */}
              {resumeModal.suggestedQuestions && resumeModal.suggestedQuestions.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
                    Interview Questions for Candidate
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Targeted deep-dive technical questions derived from candidate profile & job criteria:
                  </p>
                  <ul className="space-y-2 pt-1">
                    {resumeModal.suggestedQuestions.map((q, idx) => (
                      <li key={idx} className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-2.5 flex items-start gap-2 shadow-sm">
                        <span className="font-bold text-teal-600 shrink-0">{idx + 1}.</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Progressive Disclosure Resume Download Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-brand-600" />
                    Full Candidate Resume (PDF)
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Unlocked for interview review ({resumeModal.currentStage} stage).
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDownloadResume(resumeModal.id, resumeModal.candidateName)}
                    disabled={downloadingResume}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-md shadow-xs disabled:opacity-50 transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{downloadingResume ? 'Loadingâ€¦' : 'Open PDF in Tab'}</span>
                  </button>
                  <button
                    onClick={() => handleSaveResume(resumeModal.id, resumeModal.candidateName)}
                    disabled={downloadingResume}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-md shadow-sm disabled:opacity-50 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Save File</span>
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={() => setResumeModal(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-md hover:bg-slate-50"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}

