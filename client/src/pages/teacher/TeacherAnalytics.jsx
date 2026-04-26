import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts'
import { TrendingDown, Users, Target } from 'lucide-react'
import api from '../../utils/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import Badge from '../../components/Badge'

export default function TeacherAnalytics({ classes }) {
  const [selectedClass, setSelectedClass] = useState('')
  const classID = selectedClass || classes[0]?.classID

  const { data: resultsData, isLoading } = useQuery({
    queryKey: ['classResults', classID],
    queryFn:  () => api.get(`/teacher/results/${classID}`).then(r => r.data),
    enabled:  !!classID,
  })

  const { data: attHistory = [] } = useQuery({
    queryKey: ['attHistory', classID],
    queryFn:  async () => {
      // Build last 7 days attendance summary
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        try {
          const res = await api.get(`/teacher/attendance/${classID}/${dateStr}`)
          const records = res.data
          const present = records.filter(r => r.status === 'present').length
          days.push({ date: dateStr.slice(5), present, absent: records.length - present })
        } catch {
          days.push({ date: dateStr.slice(5), present: 0, absent: 0 })
        }
      }
      return days
    },
    enabled: !!classID,
  })

  const results    = resultsData?.results   || []
  const weakTopics = resultsData?.weakTopics || []

  if (isLoading) return <LoadingSpinner text="Loading analytics…"/>

  return (
    <div className="space-y-5">
      {/* Class selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Class:</label>
        <select
          value={selectedClass || classID}
          onChange={e => setSelectedClass(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        >
          {classes.map(c => <option key={c.classID} value={c.classID}>{c.className}</option>)}
        </select>
      </div>

      {/* Attendance chart */}
      <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users size={16} className="text-primary"/> Attendance — Last 7 Days
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={attHistory} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
            <XAxis dataKey="date" tick={{ fontSize: 11 }}/>
            <YAxis tick={{ fontSize: 11 }}/>
            <Tooltip/>
            <Legend wrapperStyle={{ fontSize: 12 }}/>
            <Bar dataKey="present" name="Present" fill="#6C3FCF" radius={[4,4,0,0]}/>
            <Bar dataKey="absent"  name="Absent"  fill="#FCA5A5" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* MCQ Results table */}
      <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Target size={16} className="text-primary"/> Student MCQ Results
        </h2>
        {results.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No results yet for this class</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 rounded-xl">
                <tr>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Attempted</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Correct</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {results
                  .sort((a, b) => b.score - a.score)
                  .map((r, i) => (
                    <tr key={r.userID} className="hover:bg-gray-50">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          {i < 3 && <span className="text-sm">{['🥇','🥈','🥉'][i]}</span>}
                          <div>
                            <p className="font-medium text-gray-800">{r.name}</p>
                            <p className="text-xs text-gray-400">{r.userID}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center text-gray-600">{r.total}</td>
                      <td className="px-3 py-3 text-center text-green-600 font-medium">{r.correct}</td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{
                                width: `${r.score}%`,
                                background: r.score >= 75 ? '#6C3FCF' : r.score >= 50 ? '#F97316' : '#EF4444'
                              }}
                            />
                          </div>
                          <span className={`text-xs font-bold ${
                            r.score >= 75 ? 'text-primary' : r.score >= 50 ? 'text-accent' : 'text-red-500'
                          }`}>{r.score}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Weak Topics (classwide) */}
      {weakTopics.length > 0 && (
        <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingDown size={16} className="text-red-500"/> Class Weak Topics
          </h2>
          <div className="space-y-2">
            {weakTopics.map(t => (
              <div key={t.tag} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{t.tag}</span>
                    <span className="text-xs font-bold text-red-600">{t.percentage}%</span>
                  </div>
                  <div className="h-1.5 bg-red-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${t.percentage}%` }}/>
                  </div>
                </div>
                <Badge color="red">Needs Work</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topic performance bar chart */}
      {weakTopics.length > 0 && (
        <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Topic Performance Overview</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weakTopics} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <XAxis dataKey="tag" tick={{ fontSize: 11 }}/>
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%"/>
              <Tooltip formatter={v => [`${v}%`, 'Class Avg']}/>
              <Bar dataKey="percentage" radius={[6,6,0,0]}>
                {weakTopics.map((t, i) => (
                  <Cell key={i} fill={t.percentage < 40 ? '#EF4444' : '#F97316'}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}