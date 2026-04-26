import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Play, Radio, Brain, Bell } from 'lucide-react'
import api from '../../utils/api'
import useAuthStore from '../../store/authStore'
import useNotificationStore from '../../store/notificationStore'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { getYouTubeID, formatDate, getMCQStatus } from '../../utils/helpers'
import toast from 'react-hot-toast'

function StatCard({ label, value, sub, color = 'purple' }) {
  const colors = {
    purple: 'from-purple-500 to-primary',
    orange: 'from-orange-400 to-accent',
    green:  'from-green-500 to-teal-500',
  }
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${colors[color]} p-4 text-white`}>
      <p className="text-white/70 text-xs font-medium uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {sub && <p className="text-white/70 text-xs mt-0.5">{sub}</p>}
    </div>
  )
}

export default function StudentHome() {
  const user      = useAuthStore(s => s.user)
  const notifs    = useNotificationStore(s => s.notifications)
  const [aiModal, setAiModal] = useState(false)
  const [aiPoints, setAiPoints] = useState([])
  const [aiLoading, setAiLoading] = useState(false)

  const { data: content = [] } = useQuery({
    queryKey: ['content', user.classID],
    queryFn:  () => api.get(`/student/content/${user.classID}`).then(r => r.data),
  })

  const { data: attendance } = useQuery({
    queryKey: ['attendance', user.userID],
    queryFn:  () => api.get(`/student/attendance/${user.userID}`).then(r => r.data),
  })

  const { data: liveMCQs = [] } = useQuery({
    queryKey: ['liveMCQs', user.classID],
    queryFn:  () => api.get(`/student/mcqs/live/${user.classID}`).then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: results } = useQuery({
    queryKey: ['results', user.userID],
    queryFn:  () => api.get(`/student/results/${user.userID}`).then(r => r.data),
  })

  const recentVideos = content.filter(c => c.type === 'video').slice(0, 3)
  const latestNotif  = notifs[0]?.message || 'Welcome to JSS Institute! Stay tuned for updates.'

  async function handleExplainWeakness() {
    const weak = results?.byTopic?.filter(t => t.percentage < 50).map(t => t.tag) || []
    if (!weak.length) { toast('No weak topics found — keep it up!'); return }
    setAiLoading(true)
    setAiModal(true)
    try {
      const { data } = await api.post('/student/ai/explain-weakness', { weakTopics: weak })
      setAiPoints(data.points)
    } catch {
      toast.error('AI service unavailable')
      setAiModal(false)
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Marquee notification bar */}
      <div className="bg-primary rounded-xl px-4 py-2.5 overflow-hidden relative">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-white flex-shrink-0" />
          <div className="overflow-hidden flex-1">
            <p className="text-white text-sm animate-marquee whitespace-nowrap">{latestNotif}</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Attendance"    value={`${attendance?.percentage ?? 0}%`}
          sub={`${attendance?.present ?? 0}/${attendance?.total ?? 0} days`} color="purple" />
        <StatCard label="Tests Done"    value={results?.results?.length ?? 0}
          sub="MCQs attempted" color="orange" />
        <StatCard label="Correct"
          value={results?.results?.filter(r => r.isCorrect).length ?? 0}
          sub="right answers"  color="green" />
      </div>

      {/* Live MCQ alert */}
      {liveMCQs.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-shrink-0">
              <span className="live-pulse relative inline-flex h-3 w-3 rounded-full bg-red-500" />
            </div>
            <span className="text-red-700 font-semibold text-sm">LIVE TEST NOW</span>
          </div>
          {liveMCQs.map(mcq => (
            <div key={mcq._id} className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-gray-800 text-sm">{mcq.question.slice(0, 60)}…</p>
                <p className="text-xs text-gray-500 mt-0.5">Ends: {new Date(mcq.endTime).toLocaleTimeString()}</p>
              </div>
              <Link to="/student/test">
                <Button variant="danger" className="text-xs px-3 py-1.5 flex-shrink-0">
                  <Radio size={12}/> Start Test
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Recent Videos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">Recent Videos</h2>
          <Link to="/student/content" className="text-xs text-primary font-medium hover:underline">View all</Link>
        </div>
        {recentVideos.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6 bg-white rounded-xl border border-gray-100">
            No videos uploaded yet
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recentVideos.map(v => {
              const ytID = getYouTubeID(v.url)
              return (
                <div key={v._id} className="bg-card rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative bg-gray-100 aspect-video">
                    {ytID
                      ? <img src={`https://img.youtube.com/vi/${ytID}/mqdefault.jpg`} alt={v.title} className="w-full h-full object-cover"/>
                      : <div className="w-full h-full flex items-center justify-center"><Play size={24} className="text-gray-400"/></div>
                    }
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                        <Play size={16} className="text-primary ml-0.5"/>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm text-gray-800 line-clamp-1">{v.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(v.createdAt)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Explain Weakness */}
      <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-white">AI Study Assistant</h3>
          <p className="text-purple-200 text-sm mt-0.5">Get a personalised 5-point study guide for your weak topics</p>
        </div>
        <Button variant="secondary" className="border-white text-white hover:bg-white/10 flex-shrink-0"
          onClick={handleExplainWeakness}>
          <Brain size={16}/> Explain Weakness
        </Button>
      </div>

      {/* AI Modal */}
      <Modal open={aiModal} onClose={() => setAiModal(false)} title="AI Study Guide — Your Weak Topics">
        {aiLoading ? (
          <div className="flex flex-col items-center py-10 gap-3">
            <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p className="text-sm text-gray-500">AI is generating your study guide…</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">Here's your personalised 5-point revision plan:</p>
            {aiPoints.map((point, i) => (
              <div key={i} className="flex gap-3 p-3 bg-purple-50 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
                <p className="text-sm text-gray-700">{point}</p>
              </div>
            ))}
            <Button variant="primary" className="w-full mt-2" onClick={() => setAiModal(false)}>Got it, thanks!</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}