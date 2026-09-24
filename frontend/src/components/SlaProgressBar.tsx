import { Clock, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react'

interface Props {
  stageEnteredAt: string
  slaDeadlineAt: string | null
  breached: boolean
}

/**
 * Modern real-world SLA Progress Tracker:
 * Visual countdown bar with color coding and humanized remaining time.
 */
export default function SlaProgressBar({ stageEnteredAt, slaDeadlineAt, breached }: Props) {
  if (!slaDeadlineAt) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium py-1">
        <Clock className="w-3.5 h-3.5 text-slate-300" />
        <span>No active SLA timer</span>
      </div>
    )
  }

  const entered = new Date(stageEnteredAt).getTime()
  const deadline = new Date(slaDeadlineAt).getTime()
  const now = Date.now()
  const total = Math.max(1, deadline - entered)
  const elapsed = now - entered
  const pct = breached ? 100 : Math.min(100, Math.max(0, (elapsed / total) * 100))

  // Time remaining calculation
  const diffMs = deadline - now
  const remainingHours = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)))
  const remainingDays = Math.floor(remainingHours / 24)
  const remHoursAfterDays = remainingHours % 24

  let timeText = ''
  if (breached || diffMs <= 0) {
    timeText = 'SLA Deadline Breached'
  } else if (remainingDays > 0) {
    timeText = `${remainingDays}d ${remHoursAfterDays}h remaining`
  } else {
    timeText = `${remainingHours}h remaining`
  }

  // Color logic
  let barColor = 'bg-teal-600'
  let textColor = 'text-brand-600'
  let icon = <Clock className="w-3.5 h-3.5 text-teal-600 animate-pulse" />

  if (breached || pct >= 100) {
    barColor = 'bg-rose-500'
    textColor = 'text-rose-600 font-semibold'
    icon = <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
  } else if (pct >= 80) {
    barColor = 'bg-amber-500'
    textColor = 'text-amber-700 font-semibold'
    icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
  }

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium text-slate-700">
          {icon}
          <span>{breached ? 'Overdue' : 'SLA Window'}</span>
        </span>
        <span className={textColor}>{timeText}</span>
      </div>

      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex justify-between text-[11px] text-slate-400">
        <span>{pct.toFixed(0)}% elapsed</span>
        <span>Deadline: {new Date(slaDeadlineAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  )
}
