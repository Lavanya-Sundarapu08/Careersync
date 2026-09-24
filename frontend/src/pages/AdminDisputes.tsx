import { useEffect, useState } from 'react'
import client from '../api/client'
import type { ApiResponse } from '../types'
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Scale } from 'lucide-react'

interface DisputeTicket {
  id: string
  reason: string
  status: string
  breachEvent: { stage: string; breachedAt: string }
}

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState<DisputeTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  function load() {
    client.get<ApiResponse<DisputeTicket[]>>('/admin/disputes')
      .then((res) => setDisputes(res.data.data))
      .catch((err) => console.error("Error loading disputes:", err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function resolve(id: string, approve: boolean) {
    setBusyId(id)
    try {
      await client.post(`/admin/disputes/${id}/resolve`, {
        approve,
        resolutionNote: approve ? 'Dispute verified and approved by admin. Breach penalty reversed.' : 'Dispute rejected by admin. SLA breach upheld.',
      })
      load()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to resolve dispute')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 shadow-xs">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              SLA Dispute Governance Center
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and adjudicate recruiter breach appeals (e.g. unannounced company holidays or technical delays).
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse h-28" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((d) => (
              <div
                key={d.id}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs hover:border-brand-400 hover:shadow-card transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        Dispute Ticket #{d.id.slice(0, 8)}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                        {d.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Breach occurred at stage: <strong className="text-slate-700">{d.breachEvent?.stage}</strong> • Time: {new Date(d.breachEvent?.breachedAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={busyId === d.id}
                      onClick={() => resolve(d.id, true)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg transition-all shadow-xs disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve &amp; Reverse Penalty
                    </button>
                    <button
                      disabled={busyId === d.id}
                      onClick={() => resolve(d.id, false)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 px-3.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-700">
                  <span className="font-bold text-slate-900 block mb-1">Recruiter Justification:</span>
                  <p className="font-normal italic leading-relaxed text-slate-600">"{d.reason}"</p>
                </div>
              </div>
            ))}

            {disputes.length === 0 && (
              <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
                <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 text-base">Zero pending dispute tickets</h3>
                <p className="text-xs text-slate-500 mt-1">
                  All SLA breaches and recruiter claims have been reviewed and audited.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
