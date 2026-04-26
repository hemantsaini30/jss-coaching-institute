import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Brain, Trophy, TrendingDown } from 'lucide-react'
import api from '../../utils/api'
import useAuthStore from '../../store/authStore'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

// Circular progress
function CircularProgress({ pct }) {
  const r = 40, circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#E9D5FF" strokeWidth="8"/>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#6C3FCF" strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }}/>
      </svg>
      <span className="absolute text-xl font-bold text-primary">{pct}%</span>
    </div>
  )
}

const MEDAL = ['🥇', '🥈', '🥉']

export default function StudentPerformance() {
  const user = useAuthStore(s => s.user)
  const [aiModal,   setAiModal]   = useState(false)
  const [aiPoints,  setAiPoints]  = useState([])
  const [aiLoading, setAiLoading] = useState(false)

  const { data: attendance, isLoading: attLoading } = useQuery({
    queryKey: ['attendance', user.userID],
    queryFn:  () => api.get(`/student/attendance/${user.userID}`).then(r => r.data),
  })

  const { data: resultsData, isLoading: resLoading } = useQuery({
    queryKey: ['results', user.userID],
    queryFn:  () => api.get(`/student/results/${user.userID}`).then(r => r.data),
  })

  const { data: leaderboard = [], isLoading: lbLoading } = useQuery({
    queryKey: ['leaderboard', user.classID],
    queryFn:  () => api.get(`/student/leaderboard/${user.classID}`).then(r => r.data),
  })

  const byTopic   = resultsData?.byTopic   || []
  const weakTopics = byTopic.filter(t => t.percentage < 50)

  async function handleExplain() {
    if (!weakTopics.length) { toast('No weak topics — great job!'); return }
    setAiLoading(true)
    setAiModal(true)
    try {
      const { data } = await api.post('/student/ai/explain-weakness', { weakTopics: weakTopics.map(t => t.tag) })
      setAiPoints(data.points)
    } catch {
      toast.error('AI service unavailable')
      setAiModal(false)
    } finally {
      setAiLoading(false)
    }
  }

  if (attLoading || resLoading) return <LoadingSpinner text="Loading performance…"/>

  return (
    <div className="space-y-5">

      {/* Attendance card */}
      <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Attendance</h2>
        <div className="flex items-center gap-6">
          <CircularProgress pct={attendance?.percentage ?? 0}/>
          <div>
            <p className="text-2xl font-bold text-gray-800">{attendance?.present ?? 0} <span className="text-base font-normal text-gray-400">days present</span></p>
            <p className="text-sm text-gray-500 mt-1">out of {attendance?.total ?? 0} total classes</p>
            <div className="mt-2 flex gap-2">
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                {attendance?.present ?? 0} Present
              </span>
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                {(attendance?.total ?? 0) - (attendance?.present ?? 0)} Absent
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MCQ Performance chart */}
      <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">MCQ Performance by Topic</h2>
        {byTopic.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No test results yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byTopic} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="tag" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%"/>
              <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
              <Bar dataKey="percentage" radius={[6,6,0,0]}>
                {byTopic.map((t, i) => (
                  <Cell key={i} fill={t.percentage < 50 ? '#EF4444' : t.percentage < 75 ? '#F97316' : '#6C3FCF'}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Weak Topics */}
      {weakTopics.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingDown size={18} className="text-red-500"/>
              <h2 className="font-semibold text-red-700">Weak Topics</h2>
            </div>
            <Button variant="primary" className="text-xs px-3 py-1.5" onClick={handleExplain}>
              <Brain size={14}/> AI Explain
            </Button>
          </div>
          <div className="space-y-2">
            {weakTopics.map(t => (
              <div key={t.tag} className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5">
                <span className="text-sm font-medium text-gray-700">{t.tag}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${t.percentage}%` }}/>
                  </div>
                  <span className="text-xs text-red-600 font-bold w-8 text-right">{t.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={18} className="text-accent"/>
          <h2 className="font-semibold text-gray-800">Class Leaderboard</h2>
        </div>
        {lbLoading ? (
          <LoadingSpinner size="sm"/>
        ) : leaderboard.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No results yet</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${
                entry.name === user.name ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'
              }`}>
                <span className="text-lg w-6 text-center">{MEDAL[i] || `#${entry.rank}`}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {entry.name}
                    {entry.name === user.name && <span className="text-xs text-primary ml-1">(You)</span>}
                  </p>
                  <p className="text-xs text-gray-400">{entry.correct}/{entry.total} correct</p>
                </div>
                <span className="text-sm font-bold text-primary">{entry.score}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Explanation Modal */}
      <Modal open={aiModal} onClose={() => setAiModal(false)} title="AI Study Guide">
        {aiLoading ? (
          <div className="flex flex-col items-center py-10 gap-3">
            <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p className="text-sm text-gray-500">AI is analysing your weak topics…</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">Your personalised 5-point revision plan:</p>
            {aiPoints.map((pt, i) => (
              <div key={i} className="flex gap-3 p-3 bg-purple-50 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
                <p className="text-sm text-gray-700">{pt}</p>
              </div>
            ))}
            <Button variant="primary" className="w-full mt-2" onClick={() => setAiModal(false)}>
              Got it!
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}