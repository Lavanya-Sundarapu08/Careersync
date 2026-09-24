import { Link } from 'react-router-dom'
import { Clock, ShieldCheck, BarChart3, FileCheck2, Scale, ArrowRight, CheckCircle2, Sparkles, Building2, UserCheck, Flame, ChevronRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="bg-white text-slate-900 overflow-hidden">

      {/* ── Hero Section ───────────────────────────────────── */}
      <section className="relative pt-20 pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50/70 via-white to-white border-b border-slate-200/80">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.08)_0%,transparent_60%)] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-brand-50 border border-brand-200 text-brand-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-brand-600 animate-ping" />
            <span>The SLA-Guaranteed Recruitment Network</span>
            <span className="text-brand-300">•</span>
            <span className="text-slate-500 font-medium">Zero Ghosting Policy</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.12]">
            Hiring With Enforceable <br />
            <span className="bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent">
              Feedback Deadlines.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            No more resume black holes. Every application on CareerSync comes with guaranteed business-hour review SLAs, live countdown timers, and public employer accountability scores.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/jobs"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-xs hover:shadow-card transition-all"
            >
              <span>Explore Verified Roles</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400 font-semibold text-sm px-6 py-3 rounded-lg transition-all"
            >
              <Building2 className="w-4 h-4 text-slate-500" />
              <span>Employer SLA Onboarding</span>
            </Link>
          </div>

          {/* Interactive Hero Mockup Card */}
          <div className="pt-10 max-w-3xl mx-auto">
            <div className="bg-white border border-slate-200/90 rounded-xl shadow-elevated p-5 sm:p-6 text-left space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-brand-700">
                    AF
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">Backend Systems Engineer</h4>
                      <span className="text-[10px] font-bold bg-accent-50 text-accent-700 border border-accent-100 px-1.5 py-0.5 rounded">
                        VERIFIED EMPLOYER
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Acme FinTech • Bengaluru, IN • 98.4% Responsiveness Score</p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>24h 12m Remaining in SLA Window</span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1 text-brand-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" /> Technical Screening Stage
                  </span>
                  <span className="text-slate-600 font-mono text-[11px]">Next: Interview Stage</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand-600 h-full rounded-full transition-all duration-500" style={{ width: '65%' }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="bg-slate-50 p-2 rounded-md border border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">SLA Commitment</span>
                  <span className="text-xs font-bold text-slate-800">40 Business Hours</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-md border border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Breach Action</span>
                  <span className="text-xs font-bold text-rose-600">Auto-Flag &amp; Score Drop</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-md border border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">ATS Score</span>
                  <span className="text-xs font-bold text-emerald-600">92% Strong Fit</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Metrics Strip ──────────────────────────────────── */}
      <section className="bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 border-y border-slate-900 text-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
          <div className="pt-4 sm:pt-0">
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">0%</p>
            <p className="text-xs uppercase font-semibold tracking-wider text-slate-400 mt-1">Ghosting Tolerance</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Enforced via automated background daemons</p>
          </div>
          <div className="pt-4 sm:pt-0 sm:pl-8">
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">48 Hours</p>
            <p className="text-xs uppercase font-semibold tracking-wider text-slate-400 mt-1">Maximum Stage Review Window</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Strict business-hour calculation engine</p>
          </div>
          <div className="pt-4 sm:pt-0 sm:pl-8">
            <p className="text-3xl sm:text-4xl font-extrabold text-brand-400 tracking-tight">100%</p>
            <p className="text-xs uppercase font-semibold tracking-wider text-slate-400 mt-1">Verified Employer Accountability</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Public responsiveness score impact</p>
          </div>
        </div>
      </section>

      {/* ── How It Works (Split View) ──────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Two-Sided Transparency</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Designed For Mutual Respect.
            </h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              Candidates get predictable milestones. Employers gain high-signal talent by proving they value candidate time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Candidate Workflow */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-7 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">For Job Seekers</h3>
                  <p className="text-xs text-slate-500">Know exactly when your next step is coming</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { step: '01', title: 'Apply With One-Click Google Login', desc: 'Attach your PDF resume. Our ATS scanner delivers instant skill-match feedback.' },
                  { step: '02', title: 'Watch Live Business-Hour Countdowns', desc: 'Track your application stage with exact hours remaining. Weekends and holidays are accounted for.' },
                  { step: '03', title: 'Guaranteed Decision or Public Flag', desc: 'If an employer misses the deadline, you receive an automated alert and their public score decreases.' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <span className="text-xs font-mono font-bold text-brand-600 bg-white border border-slate-200 px-2 py-1 rounded h-fit shrink-0">
                      {item.step}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recruiter Workflow */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-7 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">For Employers</h3>
                  <p className="text-xs text-slate-500">Stand out with verified response metrics</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { step: '01', title: 'Verified Work Email Registration', desc: 'Recruiters register with official corporate domains to guarantee authenticity.' },
                  { step: '02', title: 'Urgency-Sorted Pipeline Queue', desc: 'Applications automatically sort by SLA urgency index so your team never misses a deadline.' },
                  { step: '03', title: 'Earn Verified Employer Badges', desc: 'Companies maintaining high response rates receive verified status and top candidate traffic.' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <span className="text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 px-2 py-1 rounded h-fit shrink-0">
                      {item.step}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Grid ───────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50/50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Engineering Highlights</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Enterprise Recruitment Architecture
            </h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              Built with precision backend mechanics to handle high-concurrency recruitment operations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                icon: Clock,
                title: 'Business Hours Engine',
                desc: 'Calculates deadlines using Indian Standard Time (09:30–18:30 IST), skipping weekends and corporate holidays.',
              },
              {
                icon: BarChart3,
                title: 'Live Responsiveness Scoring',
                desc: 'Dynamic 0–100 company reliability index that penalizes ghosting and rewards consistent candidate communication.',
              },
              {
                icon: FileCheck2,
                title: 'Progressive Disclosure ATS',
                desc: 'Resume contact details remain protected during initial screening and unlock once candidate reaches Shortlisted stage.',
              },
              {
                icon: Scale,
                title: 'Dispute Governance Ledger',
                desc: 'Platform admins adjudicate breach appeals with audit logging in cases of external infrastructure outages.',
              },
            ].map((f, i) => (
              <div key={i} className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs hover:shadow-card hover:border-brand-200 transition-all space-y-3">
                <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
                  <f.icon className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">{f.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-950 text-white relative">
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <span className="text-xs font-bold text-brand-400 uppercase tracking-widest">Get Started Today</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Stop Wondering. Start Tracking.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Join candidates and forward-thinking engineering companies who believe that respectful recruitment is a fundamental standard.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/jobs"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-glow-cobalt transition-all"
            >
              <span>Explore Verified Roles</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 font-semibold text-sm px-6 py-3 rounded-lg transition-all"
            >
              <span>Sign In with Demo Credentials</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-slate-200 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <span className="text-brand-600">CareerSync</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-400 font-normal">SLA-Driven Anti-Ghosting Recruitment Engine</span>
          </div>
          <p className="text-slate-400">© 2026 CareerSync. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
