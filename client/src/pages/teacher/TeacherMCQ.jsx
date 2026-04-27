import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Sparkles, Clock, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../../utils/api'
import Button from '../../components/Button'
import Badge from '../../components/Badge'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

const LABELS = ['A', 'B', 'C', 'D']


const emptyQuestion = {
  question:     'New question',
  options:      ['Option A', 'Option B', 'Option C', 'Option D'],
  correctIndex: 0,
}

const emptyTestForm = {
  title:     '',
  classID:   '',
  duration:  30,
  startTime: '',
  endTime:   '',
}

// ─── Single Question Editor ───────────────────────────────────────
function QuestionEditor({ q, index, onSave, onDelete, saving, isDraft = false }) {
  const [local, setLocal] = useState(q)
  const setOpt = (i, v) => setLocal(l => {
    const opts = [...l.options]; opts[i] = v; return { ...l, options: opts }
  })
  const changed = isDraft || JSON.stringify(local) !== JSON.stringify(q)

  return (
    <div className={`border rounded-xl p-4 space-y-3 bg-white ${
      isDraft ? 'border-primary/40 border-dashed' : 'border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-primary uppercase tracking-wide">
          {isDraft ? '✏️ New Question' : `Question ${index + 1}`}
        </span>
        <div className="flex gap-2 items-center">
          {q.topicTag && <Badge color="purple">{q.topicTag}</Badge>}
          {q._id && !isDraft && <Badge color="green">Saved</Badge>}
          <button
            onClick={() => onDelete(q)}
            className="p-1 hover:bg-red-50 rounded text-gray-300 hover:text-red-400 transition-colors"
          >
            <Trash2 size={14}/>
          </button>
        </div>
      </div>

      <textarea
        rows={2}
        value={local.question}
        onChange={e => setLocal(l => ({ ...l, question: e.target.value }))}
        placeholder="Type your question here…"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        autoFocus={isDraft}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {local.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLocal(l => ({ ...l, correctIndex: i }))}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                local.correctIndex === i
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-300 text-gray-400 hover:border-primary'
              }`}
            >
              {LABELS[i]}
            </button>
            <input
              value={opt}
              onChange={e => setOpt(i, e.target.value)}
              placeholder={`Option ${LABELS[i]}`}
              className={`flex-1 border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                local.correctIndex === i
                  ? 'border-primary bg-purple-50'
                  : 'border-gray-200'
              }`}
            />
          </div>
        ))}
      </div>

      {q.explanation && (
        <p className="text-xs text-gray-400 italic bg-gray-50 rounded-lg px-3 py-2">
          AI: {q.explanation}
        </p>
      )}

      {changed && (
        <Button
          variant="primary"
          className="text-xs w-full py-1.5"
          loading={saving}
          onClick={() => onSave(local)}
        >
          {isDraft ? '💾 Save Question' : '✓ Update Question'}
        </Button>
      )}
    </div>
  )
}

// ─── Test Card (expanded/collapsed) ──────────────────────────────
function TestCard({ test, classes, onDeleted }) {
  const qc = useQueryClient()
  const [open,       setOpen]       = useState(false)
const [savingQ,    setSavingQ]    = useState(null)
const [localDraft, setLocalDraft] = useState(null)

  const { data: questions = [], refetch } = useQuery({
  queryKey: ['questions', test._id],
  queryFn:  () => api.get(`/teacher/tests/${test._id}/questions`).then(r => r.data),
  enabled:  open,
})

  const now    = new Date()
  const status =
    new Date(test.startTime) > now ? 'upcoming' :
    new Date(test.endTime)   < now ? 'ended'    : 'live'

  function handleAddQuestion() {
  setLocalDraft({
    question:     '',
    options:      ['', '', '', ''],
    correctIndex: 0,
  })
}

  async function handleSaveQuestion(q) {
  setSavingQ(q._id || 'draft')
  try {
    if (q._id) {
      // Update existing
      await api.put(`/teacher/tests/${test._id}/questions/${q._id}`, q)
      toast.success('Question updated — AI tagging in background…')
    } else {
      // Save new draft
      if (!q.question.trim()) {
        toast.error('Question text cannot be empty')
        setSavingQ(null)
        return
      }
      if (q.options.some(o => !o.trim())) {
        toast.error('Please fill in all 4 options')
        setSavingQ(null)
        return
      }
      await api.post(`/teacher/tests/${test._id}/questions`, q)
      setLocalDraft(null) // clear draft after save
      toast.success('Question saved — AI tagging in background…')
    }
    refetch()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Save failed')
  } finally {
    setSavingQ(null)
  }
}

  async function handleDeleteQuestion(q) {
  if (!q._id) {
    // Just clear the local draft
    setLocalDraft(null)
    return
  }
  try {
    await api.delete(`/teacher/tests/${test._id}/questions/${q._id}`)
    refetch()
    toast.success('Question removed')
  } catch {
    toast.error('Delete failed')
  }
}

  async function handleDeleteTest() {
    if (!confirm(`Delete "${test.title}" and all its questions?`)) return
    try {
      await api.delete(`/teacher/tests/${test._id}`)
      qc.invalidateQueries({ queryKey: ['teacherTests'] })
      toast.success('Test deleted')
      onDeleted()
    } catch { toast.error('Delete failed') }
  }

  return (
    <div className="bg-card border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(o => !o)}>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge color={status === 'live' ? 'green' : status === 'upcoming' ? 'gray' : 'red'}>
              {status === 'live' ? '🟢 Live' : status === 'upcoming' ? '⏳ Upcoming' : '🔴 Ended'}
            </Badge>
            <Badge color="blue">{test.questionCount ?? 0} questions</Badge>
            <Badge color="orange">{test.duration} min</Badge>
          </div>
          <p className="font-semibold text-gray-800">{test.title}</p>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <Clock size={11}/>
            {new Date(test.startTime).toLocaleString()} → {new Date(test.endTime).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-3">
          <button onClick={e => { e.stopPropagation(); handleDeleteTest() }}
            className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-400 transition-colors">
            <Trash2 size={15}/>
          </button>
          {open ? <ChevronUp size={18} className="text-gray-400"/> : <ChevronDown size={18} className="text-gray-400"/>}
        </div>
      </div>

      {/* Expanded question list */}
      {open && (
  <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50/50">
    {questions.length === 0 && !localDraft ? (
      <p className="text-sm text-gray-400 text-center py-4">
        No questions yet — add one below
      </p>
    ) : (
      questions.map((q, i) => (
        <QuestionEditor
          key={q._id}
          q={q}
          index={i}
          onSave={handleSaveQuestion}
          onDelete={handleDeleteQuestion}
          saving={savingQ === q._id}
        />
      ))
    )}

    {/* Local draft editor — shows at bottom before saving */}
    {localDraft && (
      <QuestionEditor
        q={localDraft}
        index={questions.length}
        onSave={handleSaveQuestion}
        onDelete={() => setLocalDraft(null)}
        saving={savingQ === 'draft'}
        isDraft
      />
    )}

    {/* Only show Add button if no draft is open */}
    {!localDraft && (
      <Button variant="secondary" className="w-full text-sm" onClick={handleAddQuestion}>
        <Plus size={15}/> Add Question
      </Button>
    )}
  </div>
)}
    </div>
  )
}

// ─── Main TeacherMCQ ──────────────────────────────────────────────
export default function TeacherMCQ({ classes }) {
  const qc = useQueryClient()
  const [form,      setForm]      = useState(emptyTestForm)
  const [listClass, setListClass] = useState('')
  const [showForm,  setShowForm]  = useState(false)

  const listClassID = listClass || classes[0]?.classID

  const { data: tests = [], isLoading, refetch } = useQuery({
    queryKey: ['teacherTests', listClassID],
    queryFn:  () => api.get(`/teacher/tests/${listClassID}`).then(r => r.data),
    enabled:  !!listClassID,
  })

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const { mutate: createTest, isPending } = useMutation({
    mutationFn: () => api.post('/teacher/tests', {
      ...form,
      classID:  form.classID || classes[0]?.classID,
      duration: Number(form.duration),
    }),
    onSuccess: () => {
      toast.success('Test created! Now add questions by expanding it below.')
      setForm(emptyTestForm)
      setShowForm(false)
      qc.invalidateQueries({ queryKey: ['teacherTests'] })
    },
    onError: e => toast.error(e.response?.data?.message || 'Create failed'),
  })

  function handleCreate(e) {
    e.preventDefault()
    if (!form.title.trim())   { toast.error('Test title required');         return }
    if (!form.duration || form.duration < 1) { toast.error('Duration required'); return }
    if (!form.startTime)      { toast.error('Start time required');         return }
    if (!form.endTime)        { toast.error('End time required');           return }
    if (new Date(form.endTime) <= new Date(form.startTime)) {
      toast.error('End time must be after start time'); return
    }
    createTest()
  }

  const nowLocal = () => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  }

  return (
    <div className="space-y-5">
      {/* Create test button / form toggle */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Sparkles size={16} className="text-accent"/> Test Manager
        </h2>
        <Button variant="primary" className="text-sm" onClick={() => setShowForm(o => !o)}>
          <Plus size={15}/> {showForm ? 'Cancel' : 'New Test'}
        </Button>
      </div>

      {/* Create Test Form */}
      {showForm && (
        <div className="bg-card rounded-2xl border border-primary/20 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm">Create New Test</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Test Title *</label>
                <input
                  value={form.title}
                  onChange={e => setField('title', e.target.value)}
                  placeholder="e.g. Chapter 5 — Trigonometry Test"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Class *</label>
                <select
                  value={form.classID || classes[0]?.classID}
                  onChange={e => setField('classID', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                >
                  {classes.map(c => (
                    <option key={c.classID} value={c.classID}>{c.className}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Duration (minutes) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="1" max="180"
                    value={form.duration}
                    onChange={e => setField('duration', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-xs text-gray-400 whitespace-nowrap">min</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Countdown shown to student</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Time *</label>
                <input
                  type="datetime-local"
                  value={form.startTime}
                  min={nowLocal()}
                  onChange={e => setField('startTime', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End Time *</label>
                <input
                  type="datetime-local"
                  value={form.endTime}
                  min={form.startTime || nowLocal()}
                  onChange={e => setField('endTime', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
              <strong>How it works:</strong> Create the test shell here → then expand it below → add as many questions as you want.
              Each question gets AI-tagged automatically in the background.
            </div>

            <Button type="submit" variant="primary" loading={isPending} className="w-full py-2.5">
              <Plus size={15}/> Create Test Shell
            </Button>
          </form>
        </div>
      )}

      {/* Class filter + list */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700 text-sm">
          {tests.length} test{tests.length !== 1 ? 's' : ''} for this class
        </h3>
        <select
          value={listClassID}
          onChange={e => setListClass(e.target.value)}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        >
          {classes.map(c => <option key={c.classID} value={c.classID}>{c.className}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Loading tests…</div>
      ) : tests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Sparkles size={20} className="text-gray-400"/>
          </div>
          <p className="text-gray-500 text-sm font-medium">No tests yet</p>
          <p className="text-gray-400 text-xs mt-1">Click "New Test" to create one</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map(t => (
            <TestCard
              key={t._id}
              test={t}
              classes={classes}
              onDeleted={refetch}
            />
          ))}
        </div>
      )}
    </div>
  )
}