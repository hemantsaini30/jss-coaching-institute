import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, Trash2, ExternalLink, Play, FileText, AlertCircle } from 'lucide-react'
import api from '../../utils/api'
import Button from '../../components/Button'
import Badge from '../../components/Badge'
import { formatDate, getYouTubeID } from '../../utils/helpers'
import toast from 'react-hot-toast'
import useAuthStore from '../../store/authStore'

function isValidYouTube(url) {
  return url.includes('youtube.com') || url.includes('youtu.be')
}

export default function TeacherContent({ classes }) {
  const qc   = useQueryClient()
  const user = useAuthStore(s => s.user)

  const [form, setForm] = useState({ type: 'video', title: '', url: '', classID: '' })
  const [urlError, setUrlError] = useState('')

  const classID = form.classID || classes[0]?.classID || ''

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (k === 'url') setUrlError('')
  }

  // Fetch content for selected class
  const { data: content = [], isLoading } = useQuery({
    queryKey: ['teacherContent', classID],
    queryFn:  () => api.get(`/student/content/${classID}`).then(r => r.data),
    enabled:  !!classID,
  })

  const { mutate: upload, isPending: uploading } = useMutation({
    mutationFn: () => api.post('/teacher/content', {
      type:    form.type,
      title:   form.title.trim(),
      url:     form.url.trim(),
      classID: form.classID || classes[0]?.classID,
    }),
    onSuccess: () => {
      toast.success('Content uploaded!')
      setForm(f => ({ ...f, title: '', url: '' }))
      qc.invalidateQueries({ queryKey: ['teacherContent'] })
    },
    onError: e => toast.error(e.response?.data?.message || 'Upload failed'),
  })

  const { mutate: del } = useMutation({
    mutationFn: (id) => api.delete(`/teacher/content/${id}`),
    onSuccess:  () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['teacherContent'] }) },
    onError:    ()  => toast.error('Delete failed'),
  })

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.url.trim())   { toast.error('URL is required');   return }
    if (form.type === 'video' && !isValidYouTube(form.url)) {
      setUrlError('Must be a YouTube URL (youtube.com or youtu.be)')
      return
    }
    upload()
  }

  const myContent = content.filter(c => c.teacherID === user.userID)

  return (
    <div className="space-y-5">
      {/* Upload form */}
      <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Upload size={16} className="text-primary"/> Upload Content
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2">
            {['video', 'note'].map(t => (
              <button key={t} type="button"
                onClick={() => { set('type', t); setUrlError('') }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  form.type === t
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
                }`}>
                {t === 'video' ? '▶ Video' : '📄 Note / PDF'}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
              <input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder={form.type === 'video' ? 'e.g. Intro to Trigonometry' : 'e.g. Chapter 5 Notes'}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Class *</label>
              <select
                value={form.classID || classes[0]?.classID}
                onChange={e => set('classID', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              >
                {classes.map(c => (
                  <option key={c.classID} value={c.classID}>{c.className}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {form.type === 'video' ? 'YouTube URL *' : 'Note / PDF URL *'}
            </label>
            <input
              value={form.url}
              onChange={e => set('url', e.target.value)}
              placeholder={form.type === 'video' ? 'https://youtube.com/watch?v=...' : 'https://drive.google.com/...'}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                urlError ? 'border-red-400' : 'border-gray-200'
              }`}
            />
            {urlError && (
              <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                <AlertCircle size={12}/> {urlError}
              </p>
            )}
            {form.type === 'video' && (
              <p className="text-xs text-gray-400 mt-1">Only YouTube links are supported</p>
            )}
          </div>

          <Button type="submit" variant="primary" loading={uploading} className="w-full py-2.5">
            <Upload size={15}/> Upload Content
          </Button>
        </form>
      </div>

      {/* Content list */}
      <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Your Uploads</h2>
          <select
            value={form.classID || classes[0]?.classID}
            onChange={e => set('classID', e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          >
            {classes.map(c => (
              <option key={c.classID} value={c.classID}>{c.className}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-400 text-sm">Loading…</div>
        ) : myContent.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Upload size={20} className="text-gray-400"/>
            </div>
            <p className="text-gray-400 text-sm">No content uploaded for this class yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {myContent.map(c => {
              const ytID = c.type === 'video' ? getYouTubeID(c.url) : null
              return (
                <div key={c._id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl group">
                  {/* Thumbnail / icon */}
                  <div className="w-14 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {ytID
                      ? <img src={`https://img.youtube.com/vi/${ytID}/default.jpg`} alt="" className="w-full h-full object-cover"/>
                      : <div className="w-full h-full flex items-center justify-center">
                          <FileText size={16} className="text-accent"/>
                        </div>
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge color={c.type === 'video' ? 'purple' : 'orange'}>{c.type}</Badge>
                      <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={c.url} target="_blank" rel="noreferrer"
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors">
                      <ExternalLink size={15}/>
                    </a>
                    <button onClick={() => del(c._id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={15}/>
                    </button>
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