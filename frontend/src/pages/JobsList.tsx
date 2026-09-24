import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Job } from '../types'
import { jobsApi } from '../api/services'
import ResponsivenessBadge from '../components/ResponsivenessBadge'
import { Search, MapPin, Building2, ShieldCheck, ArrowRight, Filter, BadgeCheck, Clock, Briefcase } from 'lucide-react'

export default function JobsList() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDept, setSelectedDept] = useState('ALL')
  const [selectedLocation, setSelectedLocation] = useState('ALL')

  useEffect(() => {
    jobsApi.list()
      .then((res) => setJobs(res.data.data))
      .catch((err) => console.error("Error loading jobs:", err))
      .finally(() => setLoading(false))
  }, [])

  const departments = useMemo(() => {
    const depts = new Set(jobs.map((j) => j.department).filter((d): d is string => Boolean(d)))
    return ['ALL', ...Array.from(depts)]
  }, [jobs])

  const locations = useMemo(() => {
    const locs = new Set(jobs.map((j) => j.location).filter((l): l is string => Boolean(l)))
    return ['ALL', ...Array.from(locs)]
  }, [jobs])

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.department && job.department.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesDept = selectedDept === 'ALL' || job.department === selectedDept
      const matchesLoc = selectedLocation === 'ALL' || job.location === selectedLocation

      return matchesSearch && matchesDept && matchesLoc
    })
  }, [jobs, searchQuery, selectedDept, selectedLocation])

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-accent-50 text-accent-700 border border-accent-100 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" />
              <span>LIVE ANTI-GHOSTING DIRECTORY</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Verified Open Roles
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Every position carries a guaranteed response SLA. If the employer ghosts, their reliability score drops.
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-500 bg-white border border-slate-200/80 px-3 py-1.5 rounded-lg shadow-2xs self-start sm:self-auto">
            Showing <span className="font-bold text-slate-900">{filteredJobs.length}</span> positions
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
          {/* Keyword Search */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search job title, skills, or company…"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Department Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              aria-label="Filter by department"
              className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all text-slate-700 font-medium"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'ALL' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              aria-label="Filter by location"
              className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all text-slate-700 font-medium"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc === 'ALL' ? 'All Locations' : loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Jobs Listing */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Loading verified openings…</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3 shadow-xs">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No matching positions found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search terms or clearing department and location filters.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedDept('ALL'); setSelectedLocation('ALL'); }}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 underline pt-2"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="block bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-brand-500 hover:shadow-card transition-all duration-150 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">{job.companyName}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-accent-50 text-accent-700 border border-accent-100 px-1.5 py-0.2 rounded">
                        <BadgeCheck className="w-3 h-3 text-accent-600" />
                        VERIFIED
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                      {job.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                      {job.department && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {job.department}
                        </span>
                      )}
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {job.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: SLA & Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="flex items-center gap-2">
                      <ResponsivenessBadge score={job.responsivenessScore} />
                    </div>

                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 group-hover:text-brand-700 transition-colors">
                      <span>View Role</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
