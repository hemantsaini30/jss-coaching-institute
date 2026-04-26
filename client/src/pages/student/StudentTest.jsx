import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Clock, CheckCircle, XCircle, Radio } from 'lucide-react'
import api from '../../utils/api'
import useAuthStore from '../../store/authStore'
import Button from '../../components/Button'
import Badge from '../../components/Badge'
import Modal from '../../components/Modal'
import { getMCQStatus, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/LoadingSpinner'

// Countdown timer hook
function useCountdown(endTime) {
  const [remaining, setRemaining] = useState(0)
  useEffect(() => {
    const tick = () => {
      const diff = new Date(endTime) - new Date()
      setRemaining(Math.max(0, Math.floor(diff / 1000)))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endTime])
  const mins = String(Math.floor(remaining / 60)).padStart(2, '0')
  const secs = String(remaining % 60).padStart(2, '0')
  return { remaining, display: `${mins}:${secs}` }
}

function StatusBadge({ status }) {
  if (status === 'live')     return <Badge color="green">🟢 Live</Badge>
  if (status === 'upcoming') return <Badge color="gray">Upcoming</Badge>
  return <Badge color="red">Ended</Badge>
}

function MCQTestModal({ mcq, onClose }) {
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const { display, remaining } = useCountdown(mcq.endTime)

  // Auto-close when time runs out
  useEffect(() => {
    if (remaining === 0 && !submitted) {
      toast('Time is up!', { icon: '⏰' })
      onClose()
    }
  }, [remaining, submitted, onClose])

  async function handleSubmit() {
    if (selected === null) { toast.error('Please select an answer'); return }
    setLoading(true)
    try {
      const { data } = await api.post(`/student/mcqs/${mcq._id}/submit`, { selectedIndex: selected })
      setResult(data)
      setSubmitted(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">MCQ Test</p>
            {!submitted && (
              <div className={`flex items-center gap-1.5 mt-0.5 ${remaining < 60 ? 'text-red-500' : 'text-gray-700'}`}>
                <Clock size={14}/>
                <span className="font-mono font-bold text-lg">{display}</span>
                <span className="text-xs text-gray-400">remaining</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">✕</button>
        </div>

        <div className="p-5">
          <p className="font-semibold text-gray-800 mb-5 leading-relaxed">{mcq.question}</p>

          {/* Options */}
          <div className="space-y-2 mb-6">
            {mcq.options.map((opt, i) => {
              let cls = 'border-gray-200 text-gray-700 hover:border-primary hover:bg-purple-50'
              if (submitted) {
                if (i === result.correctIndex) cls = 'border-green-500 bg-green-50 text-green-800'
                else if (i === selected && !result.isCorrect) cls = 'border-red-400 bg-red-50 text-red-700'
                else cls = 'border-gray-200 text-gray-400'
              } else if (selected === i) {
                cls = 'border-primary bg-purple-50 text-primary'
              }
              return (
                <button key={i} disabled={submitted}
                  onClick={() => setSelected(i)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-sm text-left transition-all ${cls}`}>
                  <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                  {submitted && i === result.correctIndex && <CheckCircle size={16} className="ml-auto text-green-500"/>}
                  {submitted && i === selected && !result.isCorrect && <XCircle size={16} className="ml-auto text-red-400"/>}
                </button>
              )
            })}
          </div>

          {/* Result panel */}
          {submitted && (
            <div className={`rounded-xl p-4 mb-4 ${result.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.isCorrect
                  ? <><CheckCircle size={18} className="text-green-500"/><span className="font-semibold text-green-700">Correct! Well done.</span></>
                  : <><XCircle size={18} className="text-red-400"/><span className="font-semibold text-red-600">Incorrect</span></>
                }
              </div>
              {result.explanation && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Explanation</p>
                  <p className="text-sm text-gray-700">{result.explanation}</p>
                </div>
              )}
            </div>
          )}

          {!submitted
            ? <Button variant="primary" className="w-full py-2.5" loading={loading} onClick={handleSubmit}>
                Submit Answer
              </Button>
            : <Button variant="ghost" className="w-full py-2.5" onClick={onClose}>
                Close
              </Button>
          }
        </div>
      </div>
    </div>
  )
}

export default function StudentTest() {
  const user = useAuthStore(s => s.user)
  const [activeMCQ, setActiveMCQ] = useState(null)

  const { data: mcqs = [], isLoading, refetch } = useQuery({
    queryKey: ['mcqs', user.classID],
    queryFn:  () => api.get(`/student/mcqs/live/${user.classID}`).then(r => r.data),
    refetchInterval: 30000,
  })

  // Also fetch all class MCQs for listing (teacher endpoint not accessible, use live only + show history via results)
  const { data: results = [] } = useQuery({
    queryKey: ['results', user.userID],
    queryFn:  () => api.get(`/student/results/${user.userID}`).then(r => r.data),
    select:   d => d.results || [],
  })

  const attempted = new Set(results.map(r => r.mcqID?.toString()))

  if (isLoading) return <LoadingSpinner text="Loading tests…"/>

  return (
    <div className="space-y-5">
      {/* Live tests */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Radio size={16} className="text-red-500"/> Live Tests
        </h2>
        {mcqs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Clock size={20} className="text-gray-400"/>
            </div>
            <p className="text-gray-500 text-sm font-medium">No live tests right now</p>
            <p className="text-gray-400 text-xs mt-1">Check back later or watch for the live notification</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mcqs.map(mcq => {
              const status      = getMCQStatus(mcq)
              const hasAttempted = attempted.has(mcq._id)
              return (
                <div key={mcq._id} className="bg-card rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <StatusBadge status={status}/>
                        {mcq.topicTag && <Badge color="purple">{mcq.topicTag}</Badge>}
                        {hasAttempted && <Badge color="blue">Attempted</Badge>}
                      </div>
                      <p className="font-medium text-gray-800 text-sm">{mcq.question}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(mcq.startTime).toLocaleString()} – {new Date(mcq.endTime).toLocaleString()}
                      </p>
                    </div>
                    {status === 'live' && !hasAttempted && (
                      <Button variant="primary" className="text-xs px-3 py-1.5 flex-shrink-0"
                        onClick={() => setActiveMCQ(mcq)}>
                        Start Test
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Attempted tests history */}
      {results.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-800 mb-3">Your Attempts</h2>
          <div className="space-y-2">
            {results.slice(0, 10).map(r => (
              <div key={r._id} className={`flex items-center justify-between p-3.5 rounded-xl border ${
                r.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {r.isCorrect
                    ? <CheckCircle size={16} className="text-green-500"/>
                    : <XCircle size={16} className="text-red-400"/>
                  }
                  <span className="text-sm text-gray-700">{r.topicTag || 'General'}</span>
                </div>
                <span className="text-xs text-gray-400">{formatDate(r.submittedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MCQ Test modal */}
      {activeMCQ && (
        <MCQTestModal mcq={activeMCQ} onClose={() => { setActiveMCQ(null); refetch() }} />
      )}
    </div>
  )
}