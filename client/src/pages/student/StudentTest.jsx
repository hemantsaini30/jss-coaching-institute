import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock, CheckCircle, XCircle, Radio, ChevronRight, ChevronLeft, Send } from 'lucide-react'
import api from '../../utils/api'
import useAuthStore from '../../store/authStore'
import Button from '../../components/Button'
import Badge from '../../components/Badge'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const LABELS = ['A', 'B', 'C', 'D']

// ─── Countdown hook ───────────────────────────────────────────────
function useCountdown(seconds, onExpire) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    setRemaining(seconds)
  }, [seconds])

  useEffect(() => {
    if (remaining <= 0) { onExpire?.(); return }
    const id = setInterval(() => setRemaining(r => {
      if (r <= 1) { clearInterval(id); onExpire?.(); return 0 }
      return r - 1
    }), 1000)
    return () => clearInterval(id)
  }, [remaining > 0])

  const mins = String(Math.floor(remaining / 60)).padStart(2, '0')
  const secs = String(remaining % 60).padStart(2, '0')
  return { remaining, display: `${mins}:${secs}` }
}

// ─── Progress bar ─────────────────────────────────────────────────
function ProgressDots({ total, current, answered }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-2 rounded-full transition-all ${
          i === current
            ? 'w-6 bg-primary'
            : answered[i] !== undefined
              ? 'w-2 bg-green-400'
              : 'w-2 bg-gray-200'
        }`}/>
      ))}
    </div>
  )
}

// ─── Test Runner (full screen experience) ─────────────────────────
function TestRunner({ test, onFinish }) {
  const qc = useQueryClient()
  const user = useAuthStore(s => s.user)

  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers,    setAnswers]     = useState({})   // { questionIndex: selectedIndex }
  const [submitting, setSubmitting]  = useState(false)
  const [result,     setResult]      = useState(null)
  const [startedAt]                  = useState(Date.now())

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['testQuestions', test._id],
    queryFn:  () => api.get(`/student/tests/${test._id}/questions`).then(r => r.data),
  })

  const handleExpire = useCallback(() => {
    toast('⏰ Time is up! Submitting your answers…', { duration: 3000 })
    handleSubmit(true)
  }, [answers, questions])

  const { remaining, display } = useCountdown(test.duration * 60, handleExpire)

  const urgentTime = remaining < 60
  const warningTime = remaining < test.duration * 60 * 0.25 // last 25%

  async function handleSubmit(auto = false) {
    if (submitting || result) return
    setSubmitting(true)

    const timeTaken = Math.floor((Date.now() - startedAt) / 1000)
    const answersArray = questions.map((q, i) => ({
      questionID:    q._id,
      selectedIndex: answers[i] ?? null,
    }))

    try {
      const { data } = await api.post(`/student/tests/${test._id}/submit`, {
        answers: answersArray,
        timeTaken,
      })
      setResult(data)
      qc.invalidateQueries({ queryKey: ['liveTests'] })
      qc.invalidateQueries({ queryKey: ['results'] })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
      setSubmitting(false)
    }
  }

  if (isLoading) return <LoadingSpinner text="Loading questions…"/>

  // ── Results screen ──
  if (result) {
    const pct = result.percentage
    return (
      <div className="space-y-5">
        {/* Score banner */}
        <div className={`rounded-2xl p-6 text-center text-white ${
          pct >= 75 ? 'bg-gradient-to-br from-green-500 to-teal-600'
          : pct >= 50 ? 'bg-gradient-to-br from-orange-400 to-accent'
          : 'bg-gradient-to-br from-red-500 to-red-700'
        }`}>
          <p className="text-white/80 text-sm mb-1">Your Score</p>
          <p className="text-6xl font-bold">{pct}%</p>
          <p className="text-white/80 mt-2">
            {result.totalScore} / {result.maxScore} correct
          </p>
          <p className="text-white/60 text-xs mt-1">
            {pct >= 75 ? '🎉 Excellent work!' : pct >= 50 ? '👍 Good effort!' : '💪 Keep practising!'}
          </p>
        </div>

        {/* Per-question review */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Answer Review</h3>
          <div className="space-y-3">
            {result.answers.map((a, i) => (
              <div key={i} className={`rounded-xl border p-4 ${
                a.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-2 mb-2">
                  {a.isCorrect
                    ? <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0"/>
                    : <XCircle    size={16} className="text-red-400 mt-0.5 flex-shrink-0"/>
                  }
                  <p className="text-sm font-medium text-gray-800">
                    Q{i+1}. {a.questionText}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-1.5 mb-2 ml-6">
                  {a.options.map((opt, oi) => (
                    <div key={oi} className={`text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 ${
                      oi === a.correctIndex
                        ? 'bg-green-200 text-green-800 font-medium'
                        : oi === a.selectedIndex && !a.isCorrect
                          ? 'bg-red-200 text-red-800'
                          : 'bg-white/60 text-gray-500'
                    }`}>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        oi === a.correctIndex ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>{LABELS[oi]}</span>
                      <span className="truncate">{opt}</span>
                    </div>
                  ))}
                </div>

                {a.explanation && (
                  <div className="ml-6">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                      Explanation
                    </p>
                    <p className="text-xs text-gray-600 bg-white/70 rounded-lg px-2.5 py-2">
                      {a.explanation}
                    </p>
                  </div>
                )}

                {a.topicTag && (
                  <div className="mt-1.5 ml-6">
                    <Badge color="purple">{a.topicTag}</Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <Button variant="primary" className="w-full" onClick={onFinish}>
          Back to Tests
        </Button>
      </div>
    )
  }

  const q = questions[currentIdx]
  const totalAnswered = Object.keys(answers).length

  // ── Test taking screen ──
  return (
    <div className="space-y-4">
      {/* Header: timer + progress */}
      <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold text-gray-800 text-sm">{test.title}</p>
            <p className="text-xs text-gray-400">
              Question {currentIdx + 1} of {questions.length} •
              {totalAnswered} answered
            </p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-mono font-bold text-lg ${
            urgentTime ? 'bg-red-100 text-red-600' :
            warningTime ? 'bg-orange-100 text-orange-600' :
            'bg-purple-100 text-primary'
          }`}>
            <Clock size={16}/>
            {display}
          </div>
        </div>
        <ProgressDots total={questions.length} current={currentIdx} answered={answers}/>
      </div>

      {/* Question */}
      {q && (
        <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="font-semibold text-gray-800 mb-5 text-base leading-relaxed">
            {currentIdx + 1}. {q.question}
          </p>

          <div className="space-y-2">
            {q.options.map((opt, i) => (
              <button key={i}
                onClick={() => setAnswers(a => ({ ...a, [currentIdx]: i }))}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-sm text-left transition-all ${
                  answers[currentIdx] === i
                    ? 'border-primary bg-purple-50 text-primary'
                    : 'border-gray-200 text-gray-700 hover:border-primary/40 hover:bg-gray-50'
                }`}>
                <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                  answers[currentIdx] === i
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-300 text-gray-500'
                }`}>
                  {LABELS[i]}
                </span>
                <span>{opt}</span>
                {answers[currentIdx] === i && (
                  <CheckCircle size={16} className="ml-auto text-primary flex-shrink-0"/>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" className="flex-1"
          onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
          disabled={currentIdx === 0}>
          <ChevronLeft size={16}/> Previous
        </Button>

        {currentIdx < questions.length - 1 ? (
          <Button variant="primary" className="flex-1"
            onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}>
            Next <ChevronRight size={16}/>
          </Button>
        ) : (
          <Button variant="accent" className="flex-1" loading={submitting}
            onClick={() => {
              const unanswered = questions.length - totalAnswered
              if (unanswered > 0) {
                if (!confirm(`You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Submit anyway?`)) return
              }
              handleSubmit()
            }}>
            <Send size={15}/> Submit Test
          </Button>
        )}
      </div>

      {/* Question navigator grid */}
      <div className="bg-card rounded-2xl border border-gray-100 p-4">
        <p className="text-xs font-medium text-gray-500 mb-2">Jump to question</p>
        <div className="flex flex-wrap gap-2">
          {questions.map((_, i) => (
            <button key={i}
              onClick={() => setCurrentIdx(i)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                i === currentIdx
                  ? 'bg-primary text-white'
                  : answers[i] !== undefined
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}>
              {i + 1}
            </button>
          ))}
        </div>
        <div className="flex gap-4 mt-3">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded bg-green-100 inline-block"/> Answered
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded bg-gray-100 inline-block"/> Skipped
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded bg-primary inline-block"/> Current
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Main StudentTest ─────────────────────────────────────────────
export default function StudentTest() {
  const user = useAuthStore(s => s.user)
  const [activeTest, setActiveTest] = useState(null)

  const { data: tests = [], isLoading, refetch } = useQuery({
    queryKey: ['liveTests', user.classID],
    queryFn:  () => api.get(`/student/tests/live/${user.classID}`).then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: resultsData } = useQuery({
    queryKey: ['results', user.userID],
    queryFn:  () => api.get(`/student/results/${user.userID}`).then(r => r.data),
  })

  const pastResults = resultsData?.results || []

  if (activeTest) {
    return (
      <TestRunner
        test={activeTest}
        onFinish={() => { setActiveTest(null); refetch() }}
      />
    )
  }

  if (isLoading) return <LoadingSpinner text="Loading tests…"/>

  return (
    <div className="space-y-5">
      {/* Live tests */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Radio size={16} className="text-red-500"/> Live Tests
        </h2>

        {tests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Clock size={20} className="text-gray-400"/>
            </div>
            <p className="text-gray-500 text-sm font-medium">No live tests right now</p>
            <p className="text-gray-400 text-xs mt-1">Your teacher will schedule tests — you'll get a notification</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tests.map(t => (
              <div key={t._id} className="bg-card rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"/>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"/>
                        </span>
                        <span className="text-xs font-semibold text-green-600">LIVE</span>
                      </div>
                      <Badge color="blue">{t.questionCount} questions</Badge>
                      <Badge color="orange">{t.duration} min</Badge>
                      {t.attempted && <Badge color="gray">Completed</Badge>}
                    </div>
                    <p className="font-semibold text-gray-800">{t.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock size={11}/>
                      Ends: {new Date(t.endTime).toLocaleTimeString()}
                    </p>
                  </div>

                  {!t.attempted ? (
                    <Button variant="primary" className="flex-shrink-0"
                      onClick={() => setActiveTest(t)}>
                      Start Test
                    </Button>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-green-600 font-medium flex-shrink-0">
                      <CheckCircle size={16}/> Done
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past results */}
      {pastResults.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-800 mb-3">Past Results</h2>
          <div className="space-y-2">
            {pastResults.slice(0, 10).map(r => {
              const pct = r.maxScore ? Math.round((r.totalScore / r.maxScore) * 100) : 0
              return (
                <div key={r._id} className="flex items-center justify-between p-3.5 bg-card rounded-xl border border-gray-100 shadow-sm">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {r.testID?.title || 'Test'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {r.totalScore}/{r.maxScore} correct •
                      {Math.floor(r.timeTaken / 60)}m {r.timeTaken % 60}s taken
                    </p>
                  </div>
                  <div className={`text-lg font-bold ${
                    pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-accent' : 'text-red-500'
                  }`}>
                    {pct}%
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}