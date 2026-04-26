import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Sparkles, Clock } from 'lucide-react'
import api from '../../utils/api'
import Button from '../../components/Button'
import Badge from '../../components/Badge'
import { formatDate, getMCQStatus } from '../../utils/helpers'
import toast from 'react-hot-toast'

const LABELS = ['A', 'B', 'C', 'D']

const emptyForm = {
  question:     '',
  options:      ['', '', '', ''],
  correctIndex: 0,
  classID:      '',
  startTime:    '',
  endTime:      '',
}

export default function TeacherMCQ({ classes }) {
  const qc = useQueryClient()

  const [form,      setForm]      = useState(emptyForm)
  const [aiLoading, setAiLoading] = useState(false)
  const [listClass, setListClass] = useState('')

  const listClassID = listClass || classes[0]?.classID

  const { data: mcqs = [], isLoading } = useQuery({
    queryKey: ['teacherMCQs', listClassID],
    queryFn:  () => api.get(`/teacher/mcqs/${listClassID}`).then(r => r.data),
    enabled:  !!listClassID,
  })

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setOption = (i, v) => setForm(f => {
    const opts = [...f.options]; opts[i] = v; return { ...f, options: opts }
  })

  const { mutate: createMCQ, isPending } = useMutation({
    mutationFn: () => api.post('/teacher/mcqs', {
      question:     form.question.trim(),
      options:      form.options,
      correctIndex: Number(form.correctIndex),
      classID:      form.classID || classes[0]?.classID,
      startTime:    form.startTime,
      endTime:      form.endTime,
    }),
    onMutate:  () => setAiLoading(true),
    onSuccess: (res) => {
      setAiLoading(false)
      toast.success(`MCQ saved! Topic: ${res.data.topicTag || 'tagged by AI'}`)
      setForm(emptyForm)
      qc.invalidateQueries({ queryKey: ['teacherMCQs'] })
    },
    onError: () => {
      setAiLoading(false)
      toast.error('Failed to create MCQ')
    },
  })

  const { mutate: delMCQ } = useMutation({
    mutationFn: (id) => api.delete(`/teacher/content/${id}`),
    onSuccess:  () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['teacherMCQs'] }) },
  })

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.question.trim())        { toast.error('Question is required');          return }
    if (form.options.some(o => !o.trim())) { toast.error('All 4 options are required'); return }
    if (!form.startTime || !form.endTime)  { toast.error('Start and end time required');return }
    if (new Date(form.endTime) <= new Date(form.startTime)) {
      toast.error('End time must be after start time'); return
    }
    createMCQ()
  }

  // Default datetime helpers
  const nowLocal  = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0,16) }
  const plusHour  = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); d.setHours(d.getHours()+1); return d.toISOString().slice(0,16) }

  return (
    <div className="space-y-5">
      {/* Create MCQ form */}
      <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Sparkles size={16} className="text-accent"/> Create MCQ
          <span className="text-xs text-gray-400 font-normal ml-1">— AI will auto-tag topic + explanation</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Question */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Question *</label>
            <textarea
              rows={3}
              value={form.question}
              onChange={e => setField('question', e.target.value)}
              placeholder="Type your question here…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Options */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Options * (select correct answer)</label>
            <div className="space-y-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button type="button"
                    onClick={() => setField('correctIndex', i)}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                      Number(form.correctIndex) === i
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-300 text-gray-400 hover:border-primary'
                    }`}>
                    {LABELS[i]}
                  </button>
                  <input
                    value={opt}
                    onChange={e => setOption(i, e.target.value)}
                    placeholder={`Option ${LABELS[i]}`}
                    className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                      Number(form.correctIndex) === i ? 'border-primary bg-purple-50' : 'border-gray-200'
                    }`}
                  />
                  {Number(form.correctIndex) === i && (
                    <span className="text-xs text-primary font-medium">✓ Correct</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Class + Times */}
          <div className="grid sm:grid-cols-3 gap-3">
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
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Time *</label>
              <input type="datetime-local" value={form.startTime}
                min={nowLocal()}
                onChange={e => setField('startTime', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Time *</label>
              <input type="datetime-local" value={form.endTime}
                min={form.startTime || nowLocal()}
                onChange={e => setField('endTime', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* AI loading state */}
          {aiLoading && (
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
              <svg className="animate-spin h-4 w-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <span className="text-sm text-primary font-medium">AI is generating explanation and topic tag…</span>
            </div>
          )}

          <Button type="submit" variant="primary" loading={isPending} className="w-full py-2.5">
            <Sparkles size={15}/> Save MCQ + Generate AI Tags
          </Button>
        </form>
      </div>

      {/* MCQ list */}
      <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">MCQ List</h2>
          <select
            value={listClassID}
            onChange={e => setListClass(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          >
            {classes.map(c => <option key={c.classID} value={c.classID}>{c.className}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-400 text-sm">Loading…</div>
        ) : mcqs.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm">No MCQs created for this class yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mcqs.map(m => {
              const status = getMCQStatus(m)
              return (
                <div key={m._id} className="border border-gray-100 rounded-xl p-4 hover:border-primary/20 transition-colors group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <Badge color={status === 'live' ? 'green' : status === 'upcoming' ? 'gray' : 'red'}>
                          {status === 'live' ? '🟢 Live' : status === 'upcoming' ? '⏳ Upcoming' : '🔴 Ended'}
                        </Badge>
                        {m.topicTag && <Badge color="purple">{m.topicTag}</Badge>}
                      </div>
                      <p className="text-sm font-medium text-gray-800 line-clamp-2">{m.question}</p>
                      {m.explanation && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1 italic">{m.explanation}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400">
                        <Clock size={11}/>
                        {new Date(m.startTime).toLocaleString()} → {new Date(m.endTime).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => delMCQ(m._id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={15}/>
                    </button>
                  </div>

                  {/* Options preview */}
                  <div className="grid grid-cols-2 gap-1.5 mt-3">
                    {m.options.map((opt, i) => (
                      <div key={i} className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 ${
                        i === m.correctIndex
                          ? 'bg-green-100 text-green-700 font-medium'
                          : 'bg-gray-50 text-gray-500'
                      }`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          i === m.correctIndex ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>{LABELS[i]}</span>
                        <span className="truncate">{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}