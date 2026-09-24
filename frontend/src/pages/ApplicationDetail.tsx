import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { ApplicationDetail as Detail, ApplicationStage } from '../types'
import { applicationsApi } from '../api/services'
import { useAuth } from '../context/AuthContext'
import SlaProgressBar from '../components/SlaProgressBar'
import { 
  ArrowLeft, Clock, CheckCircle2, User, Building2, History, 
  AlertCircle, FileText, MessageSquare, Sparkles, Check, Lock, 
  Download, HelpCircle 
} from 'lucide-react'

const STAGES: ApplicationStage[] = [
  'APPLIED',
  'SCREENING',
  'SHORTLISTED',
  'INTERVIEW',
  'OFFERED',
  'HIRED'
]

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [detail, setDetail] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingResume, setDownloadingResume] = useState(false)

  async function handleDownloadResume() {
    if (!id) return
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
      const res = await applicationsApi.downloadResume(id)
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

  async function handleSaveResume() {
    if (!id) return
    setDownloadingResume(true)
    try {
      const res = await applicationsApi.downloadResume(id)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `${(detail?.summary.candidateName || 'Candidate').replace(/\s+/g, '_')}_Resume.pdf`
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

  useEffect(() => {
    if (id) {
      applicationsApi.detail(id)
        .then((res) => setDetail(res.data.data))
        .catch((err) => console.error("Error loading application detail:", err))
        .finally(() => setLoading(false))
    }
  }, [id])

  if (loading || !detail) {
    return (
      <div className="max-w-4xl mx-auto mt-16 px-4 text-center">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Loading application timelineâ€¦</p>
      </div>
    )
  }

  const { summary, history } = detail
  const currentStageIndex = STAGES.indexOf(summary.currentStage as ApplicationStage)
  const shortId = `APP-${summary.id.slice(0, 6)}`

  return (
    <div className="min-h-screen bg-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Back Link */}
        <Link
          to={user?.role === 'RECRUITER' ? '/recruiter/queue' : '/my-applications'}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {user?.role === 'RECRUITER' ? 'Back to candidate queue' : 'Back to all applications'}
        </Link>

        {/* Application Header Card */}
        <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider bg-brand-50 border border-brand-200 px-2.5 py-0.5 rounded-md font-mono">
                #{shortId}
              </span>
              <h1 className="text-2xl font-bold text-slate-900 mt-2">
                {summary.jobTitle}
              </h1>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-brand-700">Verified Role</span>
                <span>â€¢</span>
                <span>Candidate: {summary.candidateName} ({summary.candidateEmail})</span>
              </p>
            </div>

            <div className="self-start sm:self-auto">
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                summary.currentStage === 'OFFERED' || summary.currentStage === 'HIRED'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : summary.breached || summary.currentStage === 'STALE_BREACHED'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-brand-50 text-brand-700 border border-brand-200'
              }`}>
                {summary.breached ? <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> : <Clock className="w-3.5 h-3.5 text-brand-600" />}
                {summary.currentStage.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Stepper Pipeline */}
          <div className="py-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Pipeline Status</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {STAGES.map((stg, idx) => {
                const isPassed = currentStageIndex > idx || summary.currentStage === 'HIRED'
                const isCurrent = summary.currentStage === stg
                return (
                  <div
                    key={stg}
                    className={`p-2.5 rounded-md border text-center transition-all ${
                      isCurrent
                        ? 'bg-brand-50 border-brand-300 shadow-sm'
                        : isPassed
                          ? 'bg-slate-50 border-slate-200 text-slate-700'
                          : 'bg-white border-dashed border-slate-200 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider">
                      Step {idx + 1}
                    </div>
                    <div className={`text-xs font-bold mt-1 ${isCurrent ? 'text-brand-700' : 'text-slate-700'}`}>
                      {stg.charAt(0) + stg.slice(1).toLowerCase()}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Attached Resume Document Card */}
          {summary.resumeObjectKey && (
            summary.resumeUnlocked ? (
              <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900">Candidate Resume (PDF)</p>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-200 px-2 py-0.2 rounded-md">
                        Unlocked for Interview
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono truncate max-w-xs sm:max-w-md mt-0.5">
                      {summary.resumeObjectKey.split('/').pop() || 'resume.pdf'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleDownloadResume}
                    disabled={downloadingResume}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md shadow-xs transition-all disabled:opacity-50"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{downloadingResume ? 'Loadingâ€¦' : 'Open PDF in Tab'}</span>
                  </button>
                  <button
                    onClick={handleSaveResume}
                    disabled={downloadingResume}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-md shadow-sm transition-all disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Save File</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-slate-200/70 text-slate-500 flex items-center justify-center border border-slate-300 shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-700">Resume Protected</p>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/60 border border-slate-300 px-2 py-0.2 rounded-md">
                        Progressive Disclosure
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Candidate resume unlocks automatically once advanced to <strong>SHORTLISTED</strong> for interview preparation.
                    </p>
                  </div>
                </div>
              </div>
            )
          )}

          {/* SLA Live Progress Box */}
          <div className="bg-slate-50 p-4 rounded-md border border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Active Stage Deadline</h4>
            <SlaProgressBar
              stageEnteredAt={summary.stageEnteredAt}
              slaDeadlineAt={summary.slaDeadlineAt}
              breached={summary.breached}
            />
          </div>
        </div>

        {/* ATS Intelligent Screening & Competency Card */}
        {summary.atsScore != null && (
          <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-6 sm:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">ATS Relevancy Screening</h3>
                  <p className="text-xs text-slate-500">Automated job description criteria & skill extraction analysis</p>
                </div>
              </div>
              <div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5 ${
                  summary.atsScore >= 80
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : summary.atsScore >= 60
                    ? 'bg-sky-50 text-sky-700 border border-sky-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  ðŸŽ¯ {summary.atsScore}% ATS Match â€¢ {(summary.fitCategory || 'FIT').replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-md p-4">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Matched Core Qualifications
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {summary.matchedSkills && summary.matchedSkills.length > 0 ? (
                    summary.matchedSkills.map((s, idx) => (
                      <span key={idx} className="text-xs font-semibold bg-white text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg shadow-sm">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No direct matches detected</span>
                  )}
                </div>
              </div>

              <div className="bg-amber-50/50 border border-amber-100 rounded-md p-4">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Identified Gap / Growth Areas
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {summary.missingSkills && summary.missingSkills.length > 0 ? (
                    summary.missingSkills.map((s, idx) => (
                      <span key={idx} className="text-xs font-medium bg-white text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg shadow-sm">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-700 italic">No significant missing requirements</span>
                  )}
                </div>
              </div>
            </div>

            {/* Targeted Interview Questions */}
            {summary.suggestedQuestions && summary.suggestedQuestions.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-brand-600" />
                  ATS Suggested Interview Questions
                </h4>
                <p className="text-[11px] text-slate-500">
                  Tailored technical probing questions for the hiring manager based on candidate profile:
                </p>
                <div className="space-y-2 pt-1">
                  {summary.suggestedQuestions.map((q, idx) => (
                    <div key={idx} className="text-xs text-slate-700 bg-white border border-slate-200 rounded-md p-3 flex items-start gap-2 shadow-sm">
                      <span className="font-bold text-brand-600 shrink-0">{idx + 1}.</span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Audit History Timeline */}
        <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <History className="w-5 h-5 text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">Immutable Audit Ledger</h2>
          </div>

          <ol className="relative border-l border-brand-200 ml-3.5 space-y-6 pt-2">
            {history.map((h, i) => (
              <li key={i} className="pl-6 relative group">
                {/* Dot */}
                <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-white border-2 border-brand-500" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-sm font-semibold text-slate-900">
                    {h.fromStage ? `${h.fromStage} â†’ ` : 'Started at '}
                    <span className="text-brand-600">{h.toStage}</span>
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {new Date(h.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Action by: <strong>{h.actorName}</strong></span>
                  </span>
                  {h.durationBusinessHours != null && (
                    <>
                      <span>â€¢</span>
                      <span className="font-semibold text-brand-700">
                        {h.durationBusinessHours.toFixed(1)} business hours in stage
                      </span>
                    </>
                  )}
                </div>

                {/* Recruiter feedback note */}
                {h.note && (
                  <div className="mt-2 bg-slate-50 border border-slate-200 rounded-md p-2.5 text-xs text-slate-700 flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-brand-600 mt-0.5 shrink-0" />
                    <span className="italic leading-relaxed">"{h.note}"</span>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>

      </div>
    </div>
  )
}

