import { useQuery } from '@tanstack/react-query'
import { Users, BookOpen, MessageSquare, Radio, Play, FileText } from 'lucide-react'
import api from '../../utils/api'
import { formatDate, getYouTubeID, getMCQStatus } from '../../utils/helpers'
import LoadingSpinner from '../../components/LoadingSpinner'
import Badge from '../../components/Badge'

function StatCard({ icon: Icon, label, value, sub, gradient }) {
  return (
    <div className={`rounded-2xl p-5 text-white bg-gradient-to-br ${gradient}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/70 text-xs font-medium uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {sub && <p className="text-white/60 text-xs mt-0.5">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  )
}

export default function AdminHome() {
  const { data: users = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn:  () => api.get('/admin/users').then(r => r.data),
  })

  const { data: feed, isLoading } = useQuery({
    queryKey: ['adminFeed'],
    queryFn:  () => api.get('/admin/feed').then(r => r.data),
  })

  const { data: inquiries = [] } = useQuery({
    queryKey: ['adminInquiries'],
    queryFn:  () => api.get('/admin/inquiries').then(r => r.data),
  })

  const { data: classes = [] } = useQuery({
  queryKey: ['adminClasses'],
  queryFn:  () => api.get('/public/classes').then(r => r.data),
})

  const students  = users.filter(u => u.role === 'student')
  const teachers  = users.filter(u => u.role === 'teacher')
  const newInqs   = inquiries.filter(i => i.status === 'new')
  const content   = feed?.content   || []
  const liveMCQs  = feed?.liveMCQs  || []

  if (isLoading) return <LoadingSpinner text="Loading overview…" />

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users}         label="Students"    value={students.length}  sub="enrolled"        gradient="from-primary to-primary-light" />
        <StatCard icon={Users}         label="Teachers"    value={teachers.length}  sub="faculty members" gradient="from-blue-500 to-blue-700"     />
        <StatCard icon={BookOpen}      label="Classes"     value={classes.length}   sub="active"          gradient="from-teal-500 to-teal-700"     />
        <StatCard icon={MessageSquare} label="New Inquiries" value={newInqs.length} sub="pending"         gradient="from-accent to-orange-600"    />
      </div>

      {/* Live MCQs */}
      {liveMCQs.length > 0 && (
        <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Radio size={16} className="text-red-500" />
            Active Tests Right Now
          </h2>
          <div className="space-y-2">
            {liveMCQs.map(m => (
              <div key={m._id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                <div>
                  <p className="text-sm font-medium text-gray-800 line-clamp-1">{m.question}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Class: {m.classID} • Ends: {new Date(m.endTime).toLocaleTimeString()}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"/>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"/>
                  </span>
                  <span className="text-xs font-semibold text-red-600">LIVE</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global content feed */}
      <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Global Content Feed</h2>
        {content.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No content uploaded yet</p>
        ) : (
          <div className="space-y-2">
            {content.slice(0, 15).map(c => {
              const ytID = c.type === 'video' ? getYouTubeID(c.url) : null
              return (
                <div key={c._id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl group">
                  <div className="w-12 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {ytID
                      ? <img src={`https://img.youtube.com/vi/${ytID}/default.jpg`} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center">
                          {c.type === 'video'
                            ? <Play size={12} className="text-primary" />
                            : <FileText size={12} className="text-accent" />
                          }
                        </div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.title}</p>
                    <p className="text-xs text-gray-400">Class: {c.classID} • {formatDate(c.createdAt)}</p>
                  </div>
                  <Badge color={c.type === 'video' ? 'purple' : 'orange'}>{c.type}</Badge>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}