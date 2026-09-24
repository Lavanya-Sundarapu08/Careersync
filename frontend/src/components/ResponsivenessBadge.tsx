import { ShieldCheck, AlertTriangle, AlertCircle, Zap } from 'lucide-react'

export default function ResponsivenessBadge({ score }: { score: number }) {
  const isHigh = score >= 85
  const isModerate = score >= 60

  const config = isHigh
    ? {
        label: 'Ultra-Responsive',
        icon: <Zap className="w-3.5 h-3.5 text-brand-600 fill-brand-600" />,
        className: 'bg-brand-50 text-brand-800 border-brand-200/80',
        dotColor: 'bg-brand-500'
      }
    : isModerate
      ? {
          label: 'Standard',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />,
          className: 'bg-amber-50 text-amber-800 border-amber-200',
          dotColor: 'bg-amber-500'
        }
      : {
          label: 'SLA Risk',
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />,
          className: 'bg-rose-50 text-rose-800 border-rose-200',
          dotColor: 'bg-rose-500'
        }

  return (
    <span
      title={`Calculated 90-day recruiter response rate: ${score.toFixed(1)}%`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-2xs ${config.className}`}
    >
      {config.icon}
      <span>{config.label}</span>
      <span className="opacity-40">•</span>
      <span className="font-mono">{score.toFixed(0)}%</span>
    </span>
  )
}
