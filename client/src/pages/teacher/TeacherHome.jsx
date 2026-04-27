import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, BookOpen, BarChart2, Upload, ClipboardCheck } from 'lucide-react'
import api from '../../utils/api'
import { formatDate } from '../../utils/helpers'
import LoadingSpinner from '../../components/LoadingSpinner'
import Badge from '../../components/Badge'

function StatCard({ icon: Icon, label, value, color = 'purple' }) {
  const colors = {
    purple: 'bg-purple-100 text-primary',
    orange: 'bg-orange-100 text-accent',
    green:  'bg-green-100 text-green-600',
    blue:   'bg-blue-100 text-blue-600',
  }
  return (
    <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center mb-3`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

export default function TeacherHome({ classes }) {
  const [selectedClass, setSelectedClass] = useState('')

  const classID = selectedClass || classes[0]?.classID

  const { data: results } = useQuery({
    queryKey: ['classResults', classID],
    queryFn:  () => api.get(`/teacher/results/${classID}`).then(r => r.data),
    enabled:  !!classID,
  })

  const { data: content = [] } = useQuery({
    queryKey: ['teacherContent', classID],
    queryFn:  () => api.get(`/student/content/${classID}`).then(r => r.data),
    enabled:  !!classID,
  })

  const { data: mcqs = [] } = useQuery({
    queryKey: ['teacherMCQs', classID],
    queryFn:  () => api.get(`/teacher/tests/${classID}`).then(r => r.data),
    enabled:  !!classID,
  })

  const avgScore = results?.results?.length
    ? Math.round(results.results.reduce((a, r) => a + r.score, 0) / results.results.length)
    : 0

  const classObj = classes.find(c => c.classID === classID)

  return (
    <div className="space-y-5">
      {/* Class selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm font-medium text-gray-700">Viewing class:</label>
        <select
          value={selectedClass || classID}
          onChange={e => setSelectedClass(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        >
          {classes.map(c => (
            <option key={c.classID} value={c.classID}>{c.className}</option>
          ))}
        </select>
        {classObj && (
          <span className="text-xs text-gray-400">Subject: {classObj.subject}</span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users}         label="Total Students"    value={results?.results?.length ?? '—'} color="purple" />
        <StatCard icon={BarChart2}     label="Avg MCQ Score"     value={`${avgScore}%`}                  color="orange" />
        <StatCard icon={Upload}        label="Content Uploaded"  value={content.length}                  color="green"  />
        <StatCard icon={ClipboardCheck} label="MCQs Created"    value={mcqs.length}                     color="blue"   />
      </div>

      {/* Recent content */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Upload size={16} className="text-primary" /> Recent Uploads
          </h2>
          {content.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No content uploaded yet</p>
          ) : (
            <ul className="space-y-2">
              {content.slice(0, 5).map(c => (
                <li key={c._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    c.type === 'video' ? 'bg-purple-100 text-primary' : 'bg-orange-100 text-accent'
                  }`}>
                    {c.type === 'video' ? '▶' : '📄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 font-medium truncate">{c.title}</p>
                    <p className="text-xs text-gray-400">{formatDate(c.createdAt)}</p>
                  </div>
                  <Badge color={c.type === 'video' ? 'purple' : 'orange'}>{c.type}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent MCQs */}
        <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <ClipboardCheck size={16} className="text-primary" /> Recent MCQs
          </h2>
          {mcqs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No MCQs created yet</p>
          ) : (
            <ul className="space-y-2">
              {mcqs.slice(0, 5).map(m => {
                const now = new Date()
                const status =
                  new Date(m.startTime) > now ? 'upcoming' :
                  new Date(m.endTime)   < now ? 'ended'    : 'live'
                return (
                  <li key={m._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 font-medium truncate">{m.question}</p>
                      {m.topicTag && <p className="text-xs text-primary mt-0.5">{m.topicTag}</p>}
                    </div>
                    <Badge color={status === 'live' ? 'green' : status === 'upcoming' ? 'gray' : 'red'}>
                      {status}
                    </Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}